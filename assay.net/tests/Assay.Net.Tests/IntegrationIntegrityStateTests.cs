using System.Text.Json;
using Assay.Net.Archetypes;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Assay.Net.Tests;

public sealed class IntegrationIntegrityStateTests
{
    private static readonly ProtocolCatalog Catalog = TestCatalog.Load();

    private static async Task<WebApplication> Start(bool verifiesSignature)
    {
        var applied = new List<string>();
        return await Repro.Start(app =>
        {
            app.MapPost("/webhook", async (HttpRequest request) =>
            {
                var raw = await Repro.Body(request);
                var signature = request.Headers["X-Signature"].ToString();
                var authentic = signature == IntegrationIntegrity.Hmac(raw, Repro.WebhookSecret);
                if (!verifiesSignature || authentic)
                {
                    using var json = JsonDocument.Parse(raw);
                    applied.Add(json.RootElement.GetProperty("id").GetString()!);
                }
                return Results.Ok(); // provider-facing acknowledgement is deliberately always 200
            });
            app.MapGet("/events", () => Results.Ok(applied));
        });
    }

    private static WebhookSubject Subject(WebApplication app) =>
        new(app.BaseUrl(), "/webhook", Repro.WebhookSecret, StatePath: "/events");

    private static VerdictStatus Status(Verdict verdict) =>
        verdict.Results.Single(result => result.CriterionId == "webhook-effects-state").Status;

    [Fact]
    public async Task webhook_state_passes_when_only_the_authentic_event_is_applied()
    {
        await using var app = await Start(verifiesSignature: true);
        var verdict = await Runner.Run(Catalog, new IntegrationIntegrity(), "webhook-state-good", Subject(app));
        Assert.Equal(VerdictStatus.Pass, Status(verdict));
    }

    [Fact]
    public async Task webhook_state_fails_when_a_forged_event_leaves_a_domain_effect()
    {
        await using var app = await Start(verifiesSignature: false);
        var verdict = await Runner.Run(Catalog, new IntegrationIntegrity(), "webhook-state-bad", Subject(app));
        Assert.Equal(VerdictStatus.Fail, Status(verdict));
    }
}
