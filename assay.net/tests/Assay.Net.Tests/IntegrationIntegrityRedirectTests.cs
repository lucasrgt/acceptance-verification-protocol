using Assay.Net;
using Assay.Net.Archetypes;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Assay.Net.Tests;

/// <summary>
/// Calibration for integration-integrity / redirect-urls-bound: a checkout/OAuth flow must bind its
/// return URLs to the real environment. The GOOD server returns real absolute https URLs for both the
/// success and failure transitions; the BAD server returns a relative path and a localhost dev host —
/// the escape where a placeholder/dev return URL ships to production and the user is bounced to a URL
/// that does not exist (or leaks back to a developer's machine). The verifier must PASS the good and
/// FAIL the bad, or the ruler is worthless.
/// </summary>
public class IntegrationIntegrityRedirectTests
{
    private static readonly ProtocolCatalog Catalog = TestCatalog.Load();

    private static VerdictStatus Of(Verdict v, string criterionId) =>
        v.Results.First(r => r.CriterionId == criterionId).Status;

    /// <summary>GOOD: both return URLs are real absolute https URLs, no placeholder or dev host.</summary>
    private static Task<WebApplication> RedirectGood() => Repro.Start(app =>
        app.MapGet("/checkout", () => Results.Ok(new
        {
            successUrl = "https://app.real.com/success",
            failureUrl = "https://app.real.com/failure",
        })));

    /// <summary>BAD: a relative success path and a localhost failure host — never bound to production.</summary>
    private static Task<WebApplication> RedirectBad() => Repro.Start(app =>
        app.MapGet("/checkout", () => Results.Ok(new
        {
            successUrl = "/success",
            failureUrl = "http://localhost:3000/failure",
        })));

    [Fact]
    public async Task redirect_passes_when_both_return_urls_are_real_absolute_https()
    {
        await using var app = await RedirectGood();
        var subject = new WebhookSubject(
            app.BaseUrl(), "/webhook", Repro.WebhookSecret, CheckoutPath: "/checkout");

        var v = await Runner.Run(Catalog, new IntegrationIntegrity(), "redirect-good", subject);

        Assert.Equal(VerdictStatus.Pass, Of(v, "redirect-urls-bound"));
    }

    [Fact]
    public async Task redirect_fails_when_a_return_url_is_relative_or_a_dev_host()
    {
        await using var app = await RedirectBad();
        var subject = new WebhookSubject(
            app.BaseUrl(), "/webhook", Repro.WebhookSecret, CheckoutPath: "/checkout");

        var v = await Runner.Run(Catalog, new IntegrationIntegrity(), "redirect-bad", subject);

        Assert.Equal(VerdictStatus.Fail, Of(v, "redirect-urls-bound")); // relative path + localhost dev host
    }
}
