using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Assay.Net.Archetypes;

/// <summary>
/// Seam for the integration-integrity archetype: an inbound webhook signed with an HMAC secret.
/// The trailing fields describe an inbound callback that must resolve a domain entity by reference:
/// <paramref name="CallbackPath"/> receives a body carrying <paramref name="KnownRef"/> (resolvable,
/// must be accepted) or <paramref name="UnknownRef"/> (unresolvable, must be refused).
/// </summary>
public sealed record WebhookSubject(
    string BaseUrl,
    string WebhookPath,
    string Secret,
    string CallbackPath = "",
    string KnownRef = "",
    string UnknownRef = "",
    string CheckoutPath = "");

/// <summary>integration-integrity — only an authentically-signed inbound callback may mutate state.</summary>
public sealed class IntegrationIntegrity : Archetype<WebhookSubject>
{
    /// <inheritdoc/>
    public override string Name => "integration-integrity";

    /// <inheritdoc/>
    public override IReadOnlyDictionary<string, Func<WebhookSubject, Task>> Oracles { get; } =
        new Dictionary<string, Func<WebhookSubject, Task>>
        {
            ["webhook-signature-verified"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);
                const string body = """{"event":"invoice.paid","id":"evt_1"}""";

                var good = Http.Request(HttpMethod.Post, s.WebhookPath, body: new StringContent(body));
                good.Headers.Add("X-Signature", Hmac(body, s.Secret));
                Http.Accepted(await http.SendAsync(good), "authentically-signed webhook");

                var forged = Http.Request(HttpMethod.Post, s.WebhookPath, body: new StringContent(body));
                forged.Headers.Add("X-Signature", "forged-signature");
                Http.Rejected(await http.SendAsync(forged), "forged-signature webhook");
            },

            ["callback-resolves-entity"] = async s =>
            {
                if (string.IsNullOrEmpty(s.CallbackPath))
                    throw new AvpSkipException("callback-resolves-entity: this subject provides no callback seam.");
                using var http = Http.Client(s.BaseUrl);

                // A callback whose reference resolves to a real domain entity must be accepted.
                var known = Http.Request(HttpMethod.Post, s.CallbackPath,
                    body: new StringContent($$"""{"ref":"{{s.KnownRef}}","status":"completed"}"""));
                Http.Accepted(await http.SendAsync(known), "callback with a resolvable reference");

                // A callback whose reference resolves to nothing must be refused — never accepted and
                // silently dropped, never applied to the wrong entity.
                var unknown = Http.Request(HttpMethod.Post, s.CallbackPath,
                    body: new StringContent($$"""{"ref":"{{s.UnknownRef}}","status":"completed"}"""));
                Http.Refused(await http.SendAsync(unknown), "callback with an unknown reference");
            },

            ["redirect-urls-bound"] = async s =>
            {
                if (string.IsNullOrEmpty(s.CheckoutPath))
                    throw new AvpSkipException("redirect-urls-bound: this subject provides no checkout seam.");
                using var http = Http.Client(s.BaseUrl);

                // A checkout/OAuth flow must bind its return URLs to the real environment: each required
                // transition is present, an absolute http(s) URL, and never a placeholder, relative path,
                // or dev host that leaks back into production.
                var res = await http.SendAsync(Http.Request(HttpMethod.Get, s.CheckoutPath));
                Http.Accepted(res, "checkout flow");
                using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());

                BindsReturnUrl(doc.RootElement, "successUrl", "success");
                BindsReturnUrl(doc.RootElement, "failureUrl", "failure");
            },
        };

    /// <summary>A required return URL must be present, an absolute http(s) URL, and never a placeholder,
    /// relative path, or dev host. Throws <see cref="AvpFailException"/> otherwise.</summary>
    private static void BindsReturnUrl(JsonElement root, string field, string transition)
    {
        var url = root.TryGetProperty(field, out var v) ? v.GetString() : null;
        if (string.IsNullOrEmpty(url))
            throw new AvpFailException($"{transition} return URL ({field}): missing or empty.");

        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            throw new AvpFailException(
                $"{transition} return URL ({field}): '{url}' is not an absolute http(s) URL.");

        string[] taints = ["localhost", "127.0.0.1", "example.com", "TODO"];
        if (url.StartsWith('/') || taints.Any(t => url.Contains(t, StringComparison.OrdinalIgnoreCase)))
            throw new AvpFailException(
                $"{transition} return URL ({field}): '{url}' is a placeholder, relative path, or dev host.");
    }

    /// <summary>HMAC-SHA256 over the raw body, hex lowercase. Public so a repro server can sign identically.</summary>
    public static string Hmac(string body, string secret)
    {
        using var h = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        return Convert.ToHexString(h.ComputeHash(Encoding.UTF8.GetBytes(body))).ToLowerInvariant();
    }
}
