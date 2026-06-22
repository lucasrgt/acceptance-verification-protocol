using System.Net.Http.Json;
using System.Text.Json;

namespace Assay.Net.Archetypes;

/// <summary>
/// Seam for the credential-authority archetype: an authentication endpoint that issues a session token only for
/// valid credentials. <paramref name="ValidCredentials"/> is a body that MUST authenticate; <paramref name="InvalidCredentials"/>
/// a body that MUST NOT; <paramref name="TokenField"/> is the response field carrying the issued token.
/// </summary>
public sealed record CredentialAuthoritySubject(
    string BaseUrl,
    string LoginPath,
    object ValidCredentials,
    object InvalidCredentials,
    string TokenField = "accessToken");

/// <summary>
/// credential-authority — an auth endpoint is the authority on identity: invalid credentials are denied and NEVER
/// yield a token (the deny path — a silent accept is an auth bypass, trivial code with catastrophic blast radius),
/// and valid credentials do issue one. The deny calibration is the load-bearing half.
/// </summary>
public sealed class CredentialAuthority : Archetype<CredentialAuthoritySubject>
{
    /// <inheritdoc/>
    public override string Name => "credential-authority";

    /// <inheritdoc/>
    public override IReadOnlyDictionary<string, Func<CredentialAuthoritySubject, Task>> Oracles { get; } =
        new Dictionary<string, Func<CredentialAuthoritySubject, Task>>
        {
            ["rejects-invalid-credentials"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);
                var res = await http.SendAsync(Post(s.LoginPath, s.InvalidCredentials));

                // A wrong credential must be denied: never a 2xx, and never a token in the body.
                if (res.IsSuccessStatusCode)
                {
                    var token = await TryReadToken(res, s.TokenField);
                    throw new AvpFailException(token is not null
                        ? $"invalid credentials were accepted: POST {s.LoginPath} returned {(int)res.StatusCode} WITH a '{s.TokenField}' — " +
                          "an auth endpoint must deny wrong credentials, never issue a token (auth bypass)."
                        : $"invalid credentials returned {(int)res.StatusCode} (success) — the deny path must be a non-2xx rejection.");
                }
            },
            ["issues-token-on-valid"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);
                var res = await http.SendAsync(Post(s.LoginPath, s.ValidCredentials));
                Http.Accepted(res, $"login with valid credentials at {s.LoginPath}");

                var token = await TryReadToken(res, s.TokenField);
                if (string.IsNullOrEmpty(token))
                    throw new AvpFailException(
                        $"valid credentials did not yield a '{s.TokenField}': POST {s.LoginPath} returned {(int)res.StatusCode} without a token.");
            },
        };

    private static HttpRequestMessage Post(string path, object body) =>
        Http.Request(HttpMethod.Post, path, body: JsonContent.Create(body, body.GetType()));

    private static async Task<string?> TryReadToken(HttpResponseMessage res, string field)
    {
        var raw = await res.Content.ReadAsStringAsync();
        if (string.IsNullOrWhiteSpace(raw))
            return null;
        try
        {
            using var doc = JsonDocument.Parse(raw);
            if (!doc.RootElement.TryGetProperty(field, out var value))
                return null;
            var text = value.ValueKind == JsonValueKind.String ? value.GetString() : value.GetRawText();
            return string.IsNullOrEmpty(text) ? null : text;
        }
        catch (JsonException)
        {
            return null; // a non-JSON body carries no token
        }
    }
}
