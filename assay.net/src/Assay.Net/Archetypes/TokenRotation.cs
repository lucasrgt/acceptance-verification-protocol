using System.Net.Http.Json;
using System.Text.Json;

namespace Assay.Net.Archetypes;

/// <summary>
/// Seam for the token-rotation archetype: a refresh endpoint that rotates the session and detects replay. The
/// archetype is self-priming — each oracle mints its OWN fresh refresh token by logging in (<paramref name="LoginPath"/>
/// with <paramref name="Credentials"/>), so the two oracles never contend over one spent token. <paramref name="RefreshPath"/>
/// exchanges a refresh token for a fresh pair; <paramref name="RefreshField"/> is the field that carries the refresh
/// token in BOTH the login and the refresh response. The refresh endpoint takes the token as
/// <c>{ "refreshToken": "…" }</c> in the request body.
/// </summary>
public sealed record TokenRotationSubject(
    string BaseUrl,
    string LoginPath,
    object Credentials,
    string RefreshPath,
    string RefreshField = "refreshToken");

/// <summary>
/// token-rotation — a refresh endpoint rotates the session on every exchange (a valid refresh mints a NEW token,
/// never the same one), and replay of a spent token is theft: it is rejected AND burns the whole family, so a
/// leaked token cannot outlive its rotation. The replay-burn is the security feature; the calibration proves the
/// burn reaches even the legitimate just-rotated token. Each oracle logs in for its own token, so they run
/// independently against shared state (running one does not spend the other's token).
/// </summary>
public sealed class TokenRotation : Archetype<TokenRotationSubject>
{
    /// <inheritdoc/>
    public override string Name => "token-rotation";

    /// <inheritdoc/>
    public override IReadOnlyDictionary<string, Func<TokenRotationSubject, Task>> Oracles { get; } =
        new Dictionary<string, Func<TokenRotationSubject, Task>>
        {
            ["rotates-on-refresh"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);
                var initial = await Login(http, s);

                var res = await http.SendAsync(Refresh(s.RefreshPath, initial));
                Http.Accepted(res, $"refresh at {s.RefreshPath}");

                var next = await ReadToken(res, s.RefreshField, "refresh response");
                if (next == initial)
                    throw new AvpFailException(
                        $"refresh returned the SAME '{s.RefreshField}' it was given — a valid refresh must ROTATE the token, not reissue the same one.");
            },
            ["replay-burns-family"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);
                var initial = await Login(http, s);   // a fresh family, independent of the other oracle's

                // First exchange: rotate. Yields a fresh (legitimate) token and spends the initial one.
                var first = await http.SendAsync(Refresh(s.RefreshPath, initial));
                Http.Accepted(first, "first refresh (rotation)");
                var legit = await ReadToken(first, s.RefreshField, "first refresh response");

                // Replay the now-SPENT initial token: a live client still holds the rotated one, so a second
                // presentation means it leaked — it must be rejected.
                var replay = await http.SendAsync(Refresh(s.RefreshPath, initial));
                if (replay.IsSuccessStatusCode)
                    throw new AvpFailException(
                        $"replaying the spent refresh token was accepted ({(int)replay.StatusCode}) — a rotated token must never be honored again (theft).");

                // The family must be BURNED: even the legitimate just-rotated token is now dead, forcing a fresh login.
                var afterBurn = await http.SendAsync(Refresh(s.RefreshPath, legit));
                if (afterBurn.IsSuccessStatusCode)
                    throw new AvpFailException(
                        "after a replayed (stolen) token, the legitimate rotated token still worked — replay must burn the WHOLE family, not just the replayed token.");
            },
        };

    // Mint a fresh, unused refresh token by logging in — so each oracle owns an independent token family.
    private static async Task<string> Login(HttpClient http, TokenRotationSubject s)
    {
        var res = await http.SendAsync(
            Http.Request(HttpMethod.Post, s.LoginPath, body: JsonContent.Create(s.Credentials, s.Credentials.GetType())));
        Http.Accepted(res, $"login at {s.LoginPath}");
        return await ReadToken(res, s.RefreshField, "login response");
    }

    private static HttpRequestMessage Refresh(string path, string refreshToken) =>
        Http.Request(HttpMethod.Post, path, body: JsonContent.Create(new { refreshToken }));

    private static async Task<string> ReadToken(HttpResponseMessage res, string field, string what)
    {
        var raw = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);
        if (!doc.RootElement.TryGetProperty(field, out var value))
            throw new AvpFailException($"{what}: body has no '{field}' field to read the rotated token ({raw}).");
        var text = value.ValueKind == JsonValueKind.String ? value.GetString() : value.GetRawText();
        if (string.IsNullOrEmpty(text))
            throw new AvpFailException($"{what}: '{field}' was empty ({raw}).");
        return text;
    }
}
