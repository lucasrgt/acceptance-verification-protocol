using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;

namespace Assay.Net.Archetypes;

// The backend archetypes — the ~40% of escapes only a .NET adapter can reach. Each binds mechanical
// oracles to the catalog criteria over the `http` substrate, mirroring the JS adapter-http.

// ---- authorization ----

/// <summary>Seam for the authorization archetype: tokens are bearer identities the repro server maps to owners/roles.</summary>
public sealed record AuthorizationSubject(
    string BaseUrl,
    string OwnerToken,
    string OwnResource,
    string OthersResource,
    string AdminPath,
    string AdminToken,
    string LesserToken);

public sealed class Authorization : Archetype<AuthorizationSubject>
{
    public override string Name => "authorization";

    public override IReadOnlyDictionary<string, Func<AuthorizationSubject, Task>> Oracles { get; } =
        new Dictionary<string, Func<AuthorizationSubject, Task>>
        {
            ["own-resource-only"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);
                var own = await http.SendAsync(Http.Request(
                    HttpMethod.Put, s.OwnResource, s.OwnerToken, JsonContent.Create(new { name = "ok" })));
                Http.Accepted(own, "owner writing its own resource");

                var cross = await http.SendAsync(Http.Request(
                    HttpMethod.Put, s.OthersResource, s.OwnerToken, JsonContent.Create(new { name = "pwned" })));
                Http.Refused(cross, "caller writing another account's resource id (IDOR)");
            },

            ["role-required"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);
                var asAdmin = await http.SendAsync(Http.Request(HttpMethod.Get, s.AdminPath, s.AdminToken));
                Http.Accepted(asAdmin, "admin calling a privileged endpoint");

                var asLesser = await http.SendAsync(Http.Request(HttpMethod.Get, s.AdminPath, s.LesserToken));
                Http.Refused(asLesser, "a lesser role calling a privileged endpoint");
            },
        };
}

// ---- integration-integrity ----

/// <summary>Seam for the integration-integrity archetype: an inbound webhook signed with an HMAC secret.</summary>
public sealed record WebhookSubject(string BaseUrl, string WebhookPath, string Secret);

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

// ---- second-order-effects ----

/// <summary>Seam for the second-order-effects archetype: a trigger and the inboxes of every party it concerns.</summary>
public sealed record NotifySubject(string BaseUrl, string TriggerPath, IReadOnlyList<string> PartyInboxPaths);

public sealed class SecondOrderEffects : Archetype<NotifySubject>
{
    public override string Name => "second-order-effects";

    public override IReadOnlyDictionary<string, Func<NotifySubject, Task>> Oracles { get; } =
        new Dictionary<string, Func<NotifySubject, Task>>
        {
            ["notifies-all-parties"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);
                var trigger = await http.SendAsync(Http.Request(
                    HttpMethod.Post, s.TriggerPath, body: JsonContent.Create(new { booking = "b1" })));
                Http.Accepted(trigger, "trigger the state transition");

                foreach (var inbox in s.PartyInboxPaths)
                {
                    var res = await http.GetAsync(inbox);
                    Http.Accepted(res, $"reading inbox {inbox}");
                    var messages = await res.Content.ReadFromJsonAsync<List<string>>() ?? [];
                    if (messages.Count == 0)
                        throw new AvpFailException(
                            $"party inbox '{inbox}' is empty — not every party was notified.");
                }
            },
        };
}
