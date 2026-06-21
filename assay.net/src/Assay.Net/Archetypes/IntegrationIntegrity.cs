using System.Security.Cryptography;
using System.Text;

namespace Assay.Net.Archetypes;

/// <summary>Seam for the integration-integrity archetype: an inbound webhook signed with an HMAC secret.</summary>
public sealed record WebhookSubject(string BaseUrl, string WebhookPath, string Secret);

/// <summary>integration-integrity — only an authentically-signed inbound callback may mutate state.</summary>
public sealed class IntegrationIntegrity : Archetype<WebhookSubject>
{
    public override string Name => "integration-integrity";

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
        };

    /// <summary>HMAC-SHA256 over the raw body, hex lowercase. Public so a repro server can sign identically.</summary>
    public static string Hmac(string body, string secret)
    {
        using var h = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        return Convert.ToHexString(h.ComputeHash(Encoding.UTF8.GetBytes(body))).ToLowerInvariant();
    }
}
