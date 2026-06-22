using System.Net.Http.Json;
using System.Text.Json;

namespace Assay.Net.Archetypes;

/// <summary>
/// Seam for the token-rotation archetype: a refresh endpoint that rotates the session and detects replay.
/// <paramref name="InitialRefreshToken"/> is a live, unused refresh token; <paramref name="RefreshPath"/> exchanges
/// it for a fresh access+refresh pair; <paramref name="TokenField"/> is the response field carrying the new refresh
/// token. The endpoint takes the refresh token as <c>{ "refreshToken": "…" }</c> in the request body.
/// </summary>
public sealed record TokenRotationSubject(
    string BaseUrl,
    string RefreshPath,
    string InitialRefreshToken,
    string TokenField = "refreshToken");

/// <summary>
/// token-rotation — a refresh endpoint rotates the session on every exchange (a valid refresh mints a NEW token,
/// never the same one), and replay of a spent token is theft: it is rejected AND burns the whole family, so a
/// leaked token cannot outlive its rotation. The replay-burn is the security feature; the calibration proves the
/// burn reaches even the legitimate just-rotated token.
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
                var res = await http.SendAsync(Refresh(s.RefreshPath, s.InitialRefreshToken));
                Http.Accepted(res, $"refresh at {s.RefreshPath}");

                var next = await ReadToken(res, s.TokenField, "refresh response");
                if (next == s.InitialRefreshToken)
                    throw new AvpFailException(
                        $"refresh returned the SAME '{s.TokenField}' it was given — a valid refresh must ROTATE the token, not reissue the same one.");
            },
            ["replay-burns-family"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);

                // First exchange: rotate. Yields a fresh (legitimate) token and spends the initial one.
                var first = await http.SendAsync(Refresh(s.RefreshPath, s.InitialRefreshToken));
                Http.Accepted(first, "first refresh (rotation)");
                var legit = await ReadToken(first, s.TokenField, "first refresh response");

                // Replay the now-SPENT initial token: a live client still holds the rotated one, so a second
                // presentation means it leaked — it must be rejected.
                var replay = await http.SendAsync(Refresh(s.RefreshPath, s.InitialRefreshToken));
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
