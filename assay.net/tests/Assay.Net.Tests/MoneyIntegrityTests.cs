using Assay.Net;
using Assay.Net.Archetypes;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Assay.Net.Tests;

/// <summary>
/// Calibration of the money-integrity ruler: the verifier must PASS a server that splits in integer
/// cents (platform = total*bps/10000, host = total - platform → always sums exactly and matches the
/// policy fraction) and FAIL one that splits via float arithmetic (Math.Round on total*0.15 /
/// total*0.85), which leaks a cent on awkward totals — e.g. 333 cents rounds the platform share to
/// 50 when the policy fraction is 49.
/// </summary>
public class MoneyIntegrityTests
{
    private const int PlatformBps = 1500; // 15%

    private static readonly ProtocolCatalog Catalog = TestCatalog.Load();

    private static VerdictStatus Of(Verdict v, string criterionId) =>
        v.Results.First(r => r.CriterionId == criterionId).Status;

    // GOOD: integer-cent math — platform is the policy amount, host is the remainder, so the two
    // shares are non-negative and always sum back to the whole.
    private static Task<WebApplication> SplitGood() => Repro.Start(app =>
        app.MapGet("/split", (int total) =>
        {
            var platform = (int)((long)total * PlatformBps / 10000);
            var host = total - platform;
            return Results.Ok(new { platform, host });
        }));

    // BAD: float math — each share is rounded independently, so on odd cents the platform share
    // misses the policy fraction (and the two can fail to sum to the total).
    private static Task<WebApplication> SplitBad() => Repro.Start(app =>
        app.MapGet("/split", (int total) =>
        {
            var platform = (int)Math.Round(total * 0.15);
            var host = (int)Math.Round(total * 0.85);
            return Results.Ok(new { platform, host });
        }));

    [Fact]
    public async Task split_invariant_passes_the_integer_cent_server()
    {
        await using var app = await SplitGood();
        var v = await Runner.Run(Catalog, new MoneyIntegrity(), "split-good",
            new MoneyIntegritySubject(app.BaseUrl(), "/split", PlatformBps));

        Assert.Equal(VerdictStatus.Pass, Of(v, "split-invariant"));
    }

    [Fact]
    public async Task split_invariant_fails_the_float_math_server()
    {
        await using var app = await SplitBad();
        var v = await Runner.Run(Catalog, new MoneyIntegrity(), "split-bad",
            new MoneyIntegritySubject(app.BaseUrl(), "/split", PlatformBps));

        Assert.Equal(VerdictStatus.Fail, Of(v, "split-invariant")); // float rounding leaked the cent
    }
}
