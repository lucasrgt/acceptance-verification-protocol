using Assay.Net;
using Assay.Net.Archetypes;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Assay.Net.Tests;

/// <summary>
/// Calibration for the submission-gate archetype: the verifier must PASS a server that enforces a body-bearing
/// submission's precondition server-side and FAIL one where the gate lives only on the FE. The escape modelled is
/// a supplier response on a per-token link — "ready" is an awaiting link (may answer), "expired" is no longer
/// awaiting (must not). The bad server records the submission on any link, so a forged request bypasses the FE
/// gate. The third test pins the reason the archetype exists at all: the body-LESS lifecycle-gate gives a FALSE
/// red on this same correct server, because a body-less probe is refused for the wrong reason (the missing body).
/// </summary>
public class SubmissionGateTests
{
    private static readonly ProtocolCatalog Catalog = TestCatalog.Load();

    // The well-formed submission both transitions carry — enough for a ready resource to accept it.
    private static readonly object Body = new { items = new[] { new { itemId = "i1", unitValueInCents = 1500 } } };
    private static readonly object ReadyBody = new { targetId = "ready", items = new[] { new { itemId = "i1", unitValueInCents = 1500 } } };
    private static readonly object UnmetBody = new { targetId = "expired", items = new[] { new { itemId = "i1", unitValueInCents = 1500 } } };

    private static VerdictStatus Of(Verdict v, string criterionId) =>
        v.Results.First(r => r.CriterionId == criterionId).Status;

    // Link "ready" is awaiting (precondition met); any other id is no longer awaiting (precondition unmet).
    private static readonly HashSet<string> Ready = new() { "ready" };

    // GOOD: the server requires a body AND checks the precondition itself — an unanswerable link is refused (404).
    private static Task<WebApplication> SubmitGood() => Repro.Start(app =>
        app.MapPost("/submit/{id}", async (string id, HttpRequest req) =>
        {
            var body = await Repro.Body(req);
            if (!body.Contains("items"))
                return Results.UnprocessableEntity(new { error = "a submission must carry items" });
            return Ready.Contains(id)
                ? Results.Ok(new { id, status = "recorded" })
                : Results.NotFound(new { error = "this link is no longer answerable" });
        }));

    // BAD: the gate exists only on the FE — the server records the submission on any link it is asked to.
    private static Task<WebApplication> SubmitBad() => Repro.Start(app =>
        app.MapPost("/submit/{id}", async (string id, HttpRequest req) =>
        {
            var body = await Repro.Body(req);
            if (!body.Contains("items"))
                return Results.UnprocessableEntity(new { error = "a submission must carry items" });
            return Results.Ok(new { id, status = "recorded" }); // never checks the precondition
        }));

    // GOOD: the target lives in the body, and the server still resolves and gates it before recording.
    private static Task<WebApplication> BodyTargetGood() => Repro.Start(app =>
        app.MapPost("/submit", async (HttpRequest req) =>
        {
            var body = await Repro.Body(req);
            if (!body.Contains("items"))
                return Results.UnprocessableEntity(new { error = "a submission must carry items" });
            return body.Contains("\"targetId\":\"ready\"")
                ? Results.Ok(new { id = "ready", status = "recorded" })
                : Results.NotFound(new { error = "this target is no longer answerable" });
        }));

    // BAD: the server trusts the client-visible form gate and records any body target.
    private static Task<WebApplication> BodyTargetBad() => Repro.Start(app =>
        app.MapPost("/submit", async (HttpRequest req) =>
        {
            var body = await Repro.Body(req);
            if (!body.Contains("items"))
                return Results.UnprocessableEntity(new { error = "a submission must carry items" });
            return Results.Ok(new { status = "recorded" }); // never checks the body target's precondition
        }));

    [Fact]
    public async Task submission_gate_passes_the_server_side_guard()
    {
        await using var app = await SubmitGood();
        var subject = new SubmissionGateSubject(app.BaseUrl(), "/submit/ready", "/submit/expired", Body);

        var v = await Runner.Run(Catalog, new SubmissionGate(), "submit-good", subject);

        Assert.Equal(VerdictStatus.Pass, Of(v, "gate-enforced-on-submission"));
    }

    [Fact]
    public async Task submission_gate_fails_the_fe_only_gate()
    {
        await using var app = await SubmitBad();
        var subject = new SubmissionGateSubject(app.BaseUrl(), "/submit/ready", "/submit/expired", Body);

        var v = await Runner.Run(Catalog, new SubmissionGate(), "submit-bad", subject);

        Assert.Equal(VerdictStatus.Fail, Of(v, "gate-enforced-on-submission")); // recorded an unanswerable submission
    }

    [Fact]
    public async Task the_body_less_lifecycle_gate_gives_a_false_red_on_a_body_required_submission()
    {
        await using var app = await SubmitGood();
        // The body-less lifecycle-gate posts NO body, so even the ready path is refused (422 on the missing body):
        // it fails a CORRECT server for the wrong reason. That false red is exactly why submission-gate exists.
        var subject = new LifecycleGateSubject(app.BaseUrl(), "/submit/ready", "/submit/expired");

        var v = await Runner.Run(Catalog, new LifecycleGate(), "submit-good-bodyless", subject);

        Assert.Equal(VerdictStatus.Fail, Of(v, "gate-enforced-server-side"));
    }

    [Fact]
    public async Task body_target_submission_gate_passes_the_server_side_guard()
    {
        await using var app = await BodyTargetGood();
        var subject = new SubmissionGateBodyTargetSubject(app.BaseUrl(), "/submit", ReadyBody, UnmetBody);

        var v = await Runner.Run(Catalog, new SubmissionGateBodyTarget(), "body-target-good", subject);

        Assert.Equal(VerdictStatus.Pass, Of(v, "gate-enforced-on-body-target"));
    }

    [Fact]
    public async Task body_target_submission_gate_fails_the_fe_only_gate()
    {
        await using var app = await BodyTargetBad();
        var subject = new SubmissionGateBodyTargetSubject(app.BaseUrl(), "/submit", ReadyBody, UnmetBody);

        var v = await Runner.Run(Catalog, new SubmissionGateBodyTarget(), "body-target-bad", subject);

        Assert.Equal(VerdictStatus.Fail, Of(v, "gate-enforced-on-body-target"));
    }
}
