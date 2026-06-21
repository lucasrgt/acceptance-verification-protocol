using Assay.Net;
using Assay.Net.Archetypes;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Assay.Net.Tests;

/// <summary>
/// Calibration for request-idempotency: the GOOD server persists key→id and replays on a repeat (a new
/// key mints a new id); the BAD server ignores the key and mints a fresh id every time — the escape a
/// double-submit / network-retry triggers, creating a duplicate charge/booking. The verifier must FAIL
/// the bad server, or the ruler is worthless.
/// </summary>
public class RequestIdempotencyTests
{
    private static readonly ProtocolCatalog Catalog = TestCatalog.Load();

    private static VerdictStatus Of(Verdict v, string criterionId) =>
        v.Results.First(r => r.CriterionId == criterionId).Status;

    // GOOD: persist Idempotency-Key → resource id; replay the original on a repeat, new id for a new key.
    private static Task<WebApplication> Good() => Repro.Start(app =>
    {
        var byKey = new Dictionary<string, string>();
        var seq = 0;
        app.MapPost("/resources", (HttpRequest req) =>
        {
            var key = req.Headers["Idempotency-Key"].ToString();
            if (!string.IsNullOrEmpty(key) && byKey.TryGetValue(key, out var existing))
                return Results.Ok(new { id = existing }); // replay the original
            var id = $"res-{++seq}";
            if (!string.IsNullOrEmpty(key)) byKey[key] = id;
            return Results.Ok(new { id });
        });
    });

    // BAD: ignores the key, always creates a fresh resource — the duplicate-on-retry escape.
    private static Task<WebApplication> Bad() => Repro.Start(app =>
    {
        var seq = 0;
        app.MapPost("/resources", (HttpRequest req) =>
        {
            var id = $"res-{++seq}";
            return Results.Ok(new { id });
        });
    });

    [Fact]
    public async Task idempotency_passes_the_honoring_server()
    {
        await using var app = await Good();
        var subject = new RequestIdempotencySubject(app.BaseUrl(), "/resources");

        var v = await Runner.Run(Catalog, new RequestIdempotency(), "idem-good", subject);

        Assert.Equal(VerdictStatus.Pass, Of(v, "idempotency-key-honored"));
    }

    [Fact]
    public async Task idempotency_fails_the_ignoring_server()
    {
        await using var app = await Bad();
        var subject = new RequestIdempotencySubject(app.BaseUrl(), "/resources");

        var v = await Runner.Run(Catalog, new RequestIdempotency(), "idem-bad", subject);

        Assert.Equal(VerdictStatus.Fail, Of(v, "idempotency-key-honored")); // same key minted two resources
    }
}
