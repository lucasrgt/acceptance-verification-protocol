using Assay.Net;
using Assay.Net.Archetypes;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Assay.Net.Tests;

/// <summary>
/// Calibration for pagination-integrity: the GOOD server pages a fixed, stably-sorted list of 25 ids by
/// offset (pages 1,2,3 = 10,10,5) so the union is exactly 1..25. The BAD server uses an unstable/off-by-one
/// page window that drops the item on each page boundary — the escape an unstable sort or a `LIMIT n OFFSET
/// page*n` against shifting rows triggers, stranding items so the union no longer equals the full set. The
/// verifier must FAIL the bad server, or the ruler is worthless.
/// </summary>
public class PaginationIntegrityTests
{
    private static readonly ProtocolCatalog Catalog = TestCatalog.Load();
    private const int Total = 25;
    private const int Size = 10;

    private static VerdictStatus Of(Verdict v, string criterionId) =>
        v.Results.First(r => r.CriterionId == criterionId).Status;

    private static int[] Items() => Enumerable.Range(1, Total).ToArray();

    // GOOD: stable offset pagination over the fixed list — every id appears on exactly one page.
    private static Task<WebApplication> Good() => Repro.Start(app =>
        app.MapGet("/items", (int page, int size) =>
            Results.Ok(Items().Skip((page - 1) * size).Take(size))));

    // BAD: off-by-one window — each page skips one extra row, so the item on every boundary is stranded.
    private static Task<WebApplication> Bad() => Repro.Start(app =>
        app.MapGet("/items", (int page, int size) =>
            Results.Ok(Items().Skip((page - 1) * size + (page - 1)).Take(size))));

    [Fact]
    public async Task pagination_passes_the_stable_server()
    {
        await using var app = await Good();
        var subject = new PaginationIntegritySubject(app.BaseUrl(), "/items", Size, Total);

        var v = await Runner.Run(Catalog, new PaginationIntegrity(), "paging-good", subject);

        Assert.Equal(VerdictStatus.Pass, Of(v, "pages-cover-the-set"));
    }

    [Fact]
    public async Task pagination_fails_the_dropping_server()
    {
        await using var app = await Bad();
        var subject = new PaginationIntegritySubject(app.BaseUrl(), "/items", Size, Total);

        var v = await Runner.Run(Catalog, new PaginationIntegrity(), "paging-bad", subject);

        Assert.Equal(VerdictStatus.Fail, Of(v, "pages-cover-the-set")); // items stranded at each boundary
    }
}
