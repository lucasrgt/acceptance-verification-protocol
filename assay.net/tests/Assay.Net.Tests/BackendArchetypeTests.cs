using Assay.Net;
using Assay.Net.Archetypes;

namespace Assay.Net.Tests;

/// <summary>
/// Calibration of the ruler: each backend archetype must PASS its correct repro server and FAIL its
/// vulnerable one. A verifier that can't fail the bad server is worthless (a false green is the
/// catastrophic error). These are the .NET equivalents of the JS bench escape pairs.
/// </summary>
public class BackendArchetypeTests
{
    private static readonly ProtocolCatalog Catalog = TestCatalog.Load();

    private static VerdictStatus Of(Verdict v, string criterionId) =>
        v.Results.First(r => r.CriterionId == criterionId).Status;

    // ---- authorization ----

    [Fact]
    public async Task authorization_passes_the_secure_server()
    {
        await using var app = await Repro.AuthGood();
        var subject = new AuthorizationSubject(app.BaseUrl(), "owner", "/hosts/1", "/hosts/2", "/admin/hosts", "admin", "lesser");

        var v = await Runner.Run(Catalog, new Authorization(), "auth-good", subject);

        Assert.Equal(VerdictStatus.Pass, Of(v, "own-resource-only"));
        Assert.Equal(VerdictStatus.Pass, Of(v, "role-required"));
        Assert.Equal(VerdictStatus.Skipped, Of(v, "server-is-authoritative")); // no oracle yet — honest skip
        Assert.Equal(1.0, v.AcceptanceScore);
    }

    [Fact]
    public async Task authorization_fails_the_vulnerable_server()
    {
        await using var app = await Repro.AuthBad();
        var subject = new AuthorizationSubject(app.BaseUrl(), "owner", "/hosts/1", "/hosts/2", "/admin/hosts", "admin", "lesser");

        var v = await Runner.Run(Catalog, new Authorization(), "auth-bad", subject);

        Assert.Equal(VerdictStatus.Fail, Of(v, "own-resource-only")); // IDOR let the cross-account write through
        Assert.Equal(VerdictStatus.Fail, Of(v, "role-required"));     // privileged endpoint open to any role
        Assert.Equal(0.0, v.AcceptanceScore);
    }

    // ---- integration-integrity ----

    [Fact]
    public async Task webhook_signature_passes_the_verifying_server()
    {
        await using var app = await Repro.WebhookGood();
        var v = await Runner.Run(Catalog, new IntegrationIntegrity(), "webhook-good",
            new WebhookSubject(app.BaseUrl(), "/webhook", Repro.WebhookSecret));

        Assert.Equal(VerdictStatus.Pass, Of(v, "webhook-signature-verified"));
    }

    [Fact]
    public async Task webhook_signature_fails_the_blind_server()
    {
        await using var app = await Repro.WebhookBad();
        var v = await Runner.Run(Catalog, new IntegrationIntegrity(), "webhook-bad",
            new WebhookSubject(app.BaseUrl(), "/webhook", Repro.WebhookSecret));

        Assert.Equal(VerdictStatus.Fail, Of(v, "webhook-signature-verified")); // accepted a forged signature
    }

    // ---- second-order-effects ----

    [Fact]
    public async Task notify_passes_when_all_parties_are_notified()
    {
        await using var app = await Repro.NotifyGood();
        var v = await Runner.Run(Catalog, new SecondOrderEffects(), "notify-good",
            new NotifySubject(app.BaseUrl(), "/book", ["/inbox/host", "/inbox/guest"]));

        Assert.Equal(VerdictStatus.Pass, Of(v, "notifies-all-parties"));
    }

    [Fact]
    public async Task notify_fails_when_a_party_is_missed()
    {
        await using var app = await Repro.NotifyBad();
        var v = await Runner.Run(Catalog, new SecondOrderEffects(), "notify-bad",
            new NotifySubject(app.BaseUrl(), "/book", ["/inbox/host", "/inbox/guest"]));

        Assert.Equal(VerdictStatus.Fail, Of(v, "notifies-all-parties")); // the guest inbox stayed empty
    }
}
