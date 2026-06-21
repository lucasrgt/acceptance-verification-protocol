using Assay.Net;
using Assay.Net.Archetypes;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Assay.Net.Tests;

/// <summary>
/// Calibration for authorization/server-is-authoritative: the server must record its own truth for a
/// privileged field (price), never the client's word for it. The GOOD server ignores the client price
/// and always stores its authoritative 100; the BAD server trusts the client and stores the tampered 1.
/// A write that tampers with the price must be recorded as the server-resolved value — the verifier must
/// PASS the good server and FAIL the bad one (a verifier that can't fail the bad ruler is worthless).
/// </summary>
public class AuthorizationServerAuthoritativeTests
{
    private static readonly ProtocolCatalog Catalog = TestCatalog.Load();

    private static VerdictStatus Of(Verdict v, string criterionId) =>
        v.Results.First(r => r.CriterionId == criterionId).Status;

    // The GOOD server resolves the price itself (always 100), discarding whatever the client sent.
    private static Task<WebApplication> Good() => Repro.Start(app =>
    {
        var store = new Dictionary<string, object>();
        app.MapPost("/items", async (HttpRequest req) =>
        {
            var sent = await req.ReadFromJsonAsync<ClientItem>();
            store["x"] = new { item = sent?.Item ?? "x", price = 100 }; // authoritative truth, client price ignored
            return Results.Ok(new { ok = true });
        });
        app.MapGet("/items/x", () => Results.Ok(store.GetValueOrDefault("x", new { item = "x", price = 100 })));
    });

    // The BAD server trusts the client's price and stores the tampered value verbatim.
    private static Task<WebApplication> Bad() => Repro.Start(app =>
    {
        var store = new Dictionary<string, object>();
        app.MapPost("/items", async (HttpRequest req) =>
        {
            var sent = await req.ReadFromJsonAsync<ClientItem>();
            store["x"] = new { item = sent?.Item ?? "x", price = sent?.Price ?? 0 }; // trusts the client's word
            return Results.Ok(new { ok = true });
        });
        app.MapGet("/items/x", () => Results.Ok(store.GetValueOrDefault("x", new { item = "x", price = 0 })));
    });

    private static AuthorizationSubject Subject(WebApplication app) => new(
        app.BaseUrl(), "owner", "/hosts/1", "/hosts/2", "/admin/hosts", "admin", "lesser",
        WritePath: "/items", ReadPath: "/items/x", Token: "owner");

    [Fact]
    public async Task passes_when_the_server_records_its_own_truth()
    {
        await using var app = await Good();
        var v = await Runner.Run(Catalog, new Authorization(), "authoritative-good", Subject(app));

        Assert.Equal(VerdictStatus.Pass, Of(v, "server-is-authoritative"));
    }

    [Fact]
    public async Task fails_when_the_server_trusts_the_clients_tampered_value()
    {
        await using var app = await Bad();
        var v = await Runner.Run(Catalog, new Authorization(), "authoritative-bad", Subject(app));

        Assert.Equal(VerdictStatus.Fail, Of(v, "server-is-authoritative")); // recorded the tampered price (1)
    }

    private sealed record ClientItem(string? Item, int? Price);
}
