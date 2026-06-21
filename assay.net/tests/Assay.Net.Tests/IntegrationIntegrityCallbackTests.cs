using System.Text.Json;
using Assay.Net;
using Assay.Net.Archetypes;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Assay.Net.Tests;

/// <summary>
/// Calibration for integration-integrity / callback-resolves-entity: an inbound callback must carry
/// enough to resolve the domain entity it concerns. The GOOD server looks the reference up in a known
/// set and refuses (404) an unknown one; the BAD server accepts any callback regardless of its
/// reference — the escape where a callback for a missing/unknown entity is silently accepted (and so
/// dropped on the floor or applied to the wrong entity). The verifier must PASS the good and FAIL the
/// bad, or the ruler is worthless.
/// </summary>
public class IntegrationIntegrityCallbackTests
{
    private static readonly ProtocolCatalog Catalog = TestCatalog.Load();

    private static VerdictStatus Of(Verdict v, string criterionId) =>
        v.Results.First(r => r.CriterionId == criterionId).Status;

    private static string? RefOf(string raw) =>
        JsonDocument.Parse(raw).RootElement.TryGetProperty("ref", out var r) ? r.GetString() : null;

    // The real domain entities this backend knows about.
    private static readonly HashSet<string> KnownEntities = ["doc_1", "doc_2"];

    /// <summary>GOOD: resolves the reference against the known set; an unknown reference is a 404.</summary>
    private static Task<WebApplication> CallbackGood() => Repro.Start(app =>
        app.MapPost("/callbacks/sign", async (HttpRequest req) =>
        {
            var reference = RefOf(await Repro.Body(req));
            if (string.IsNullOrEmpty(reference) || !KnownEntities.Contains(reference))
                return Results.NotFound(new { error = "unknown reference" });
            return Results.Ok(new { ok = true, applied = reference });
        }));

    /// <summary>BAD: accepts any callback, never resolving the entity the reference names.</summary>
    private static Task<WebApplication> CallbackBad() => Repro.Start(app =>
        app.MapPost("/callbacks/sign", async (HttpRequest req) =>
        {
            await Repro.Body(req); // accepts any reference, resolved or not
            return Results.Ok(new { ok = true });
        }));

    [Fact]
    public async Task callback_passes_when_the_entity_is_resolved()
    {
        await using var app = await CallbackGood();
        var subject = new WebhookSubject(
            app.BaseUrl(), "/webhook", Repro.WebhookSecret,
            CallbackPath: "/callbacks/sign", KnownRef: "doc_1", UnknownRef: "doc_missing");

        var v = await Runner.Run(Catalog, new IntegrationIntegrity(), "callback-good", subject);

        Assert.Equal(VerdictStatus.Pass, Of(v, "callback-resolves-entity"));
    }

    [Fact]
    public async Task callback_fails_when_an_unknown_reference_is_accepted()
    {
        await using var app = await CallbackBad();
        var subject = new WebhookSubject(
            app.BaseUrl(), "/webhook", Repro.WebhookSecret,
            CallbackPath: "/callbacks/sign", KnownRef: "doc_1", UnknownRef: "doc_missing");

        var v = await Runner.Run(Catalog, new IntegrationIntegrity(), "callback-bad", subject);

        Assert.Equal(VerdictStatus.Fail, Of(v, "callback-resolves-entity")); // accepted an unknown reference
    }
}
