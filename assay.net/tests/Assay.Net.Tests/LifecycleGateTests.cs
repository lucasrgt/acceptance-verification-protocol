using Assay.Net;
using Assay.Net.Archetypes;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Assay.Net.Tests;

/// <summary>
/// Calibration for the lifecycle-gate archetype: the verifier must PASS a server that enforces the
/// transition's precondition server-side and FAIL one where the gate lives only on the FE. The escape
/// modelled is publishing a listing — "ready" is complete (may publish), "draft" is incomplete (must
/// not). The bad server publishes anything, so a forged/hand-crafted request bypasses the FE gate.
/// </summary>
public class LifecycleGateTests
{
    private static readonly ProtocolCatalog Catalog = TestCatalog.Load();

    private static VerdictStatus Of(Verdict v, string criterionId) =>
        v.Results.First(r => r.CriterionId == criterionId).Status;

    // Listing "ready" is complete (precondition met); "draft" is incomplete (precondition unmet).
    private static readonly HashSet<string> Complete = new() { "ready" };

    // GOOD: the server checks the precondition itself — incomplete listings are refused (409).
    private static Task<WebApplication> PublishGood() => Repro.Start(app =>
        app.MapPost("/publish/{id}", (string id) =>
            Complete.Contains(id)
                ? Results.Ok(new { id, status = "published" })
                : Results.Conflict(new { error = "listing is incomplete; cannot publish" })));

    // BAD: the gate exists only on the FE — the server publishes any listing it is asked to.
    private static Task<WebApplication> PublishBad() => Repro.Start(app =>
        app.MapPost("/publish/{id}", (string id) =>
            Results.Ok(new { id, status = "published" }))); // never checks the precondition

    [Fact]
    public async Task lifecycle_gate_passes_the_server_side_guard()
    {
        await using var app = await PublishGood();
        var subject = new LifecycleGateSubject(app.BaseUrl(), "/publish/ready", "/publish/draft");

        var v = await Runner.Run(Catalog, new LifecycleGate(), "gate-good", subject);

        Assert.Equal(VerdictStatus.Pass, Of(v, "gate-enforced-server-side"));
    }

    [Fact]
    public async Task lifecycle_gate_fails_the_fe_only_gate()
    {
        await using var app = await PublishBad();
        var subject = new LifecycleGateSubject(app.BaseUrl(), "/publish/ready", "/publish/draft");

        var v = await Runner.Run(Catalog, new LifecycleGate(), "gate-bad", subject);

        Assert.Equal(VerdictStatus.Fail, Of(v, "gate-enforced-server-side")); // published an incomplete listing
    }
}
