using Assay.Net;
using Assay.Net.Archetypes;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Assay.Net.Tests;

/// <summary>
/// Throwaway localhost HTTP servers (the real backends under verification) on Kestrel — a "good"
/// (correct) and a "bad" (vulnerable) version per archetype. The verifier must PASS the good and
/// FAIL the bad: that pair is the calibration of the ruler (a verifier that can't fail the bad is
/// useless). Mirrors the JS bench's pre-fix/post-fix escape pairs.
/// </summary>
internal static class Repro
{
    public const string WebhookSecret = "whsec_test";

    internal static async Task<WebApplication> Start(Action<WebApplication> routes)
    {
        var builder = WebApplication.CreateSlimBuilder();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Logging.ClearProviders();
        var app = builder.Build();
        routes(app);
        await app.StartAsync();
        return app;
    }

    public static string BaseUrl(this WebApplication app)
    {
        var feature = app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>();
        return feature!.Addresses.First();
    }

    internal static string? Bearer(HttpRequest req)
    {
        var h = req.Headers.Authorization.ToString();
        return h.StartsWith("Bearer ") ? h["Bearer ".Length..] : null;
    }

    internal static async Task<string> Body(HttpRequest req)
    {
        using var r = new StreamReader(req.Body);
        return await r.ReadToEndAsync();
    }

    // ---- authorization: owner of "1" is "owner", owner of "2" is "intruder"; "admin" is privileged ----

    public static Task<WebApplication> AuthGood() => Start(app =>
    {
        var owners = new Dictionary<string, string> { ["1"] = "owner", ["2"] = "intruder" };
        app.MapPut("/hosts/{id}", (string id, HttpRequest req) =>
        {
            var who = Bearer(req);
            if (who is null) return Results.Unauthorized();
            if (!owners.TryGetValue(id, out var owner) || owner != who) return Results.StatusCode(403);
            return Results.Ok(new { id, by = who });
        });
        app.MapGet("/admin/hosts", (HttpRequest req) =>
        {
            var who = Bearer(req);
            if (who is null) return Results.Unauthorized();
            return who == "admin" ? Results.Ok(new[] { "1", "2" }) : Results.StatusCode(403);
        });
    });

    public static Task<WebApplication> AuthBad() => Start(app =>
    {
        app.MapPut("/hosts/{id}", (string id, HttpRequest req) =>
        {
            var who = Bearer(req);
            if (who is null) return Results.Unauthorized();
            return Results.Ok(new { id, by = who }); // IDOR: never checks ownership
        });
        app.MapGet("/admin/hosts", (HttpRequest req) =>
        {
            var who = Bearer(req);
            if (who is null) return Results.Unauthorized();
            return Results.Ok(new[] { "1", "2" }); // "any authenticated" — no role check
        });
    });

    // ---- integration-integrity: webhook HMAC ----

    public static Task<WebApplication> WebhookGood() => Start(app =>
        app.MapPost("/webhook", async (HttpRequest req) =>
        {
            var raw = await Body(req);
            var sig = req.Headers["X-Signature"].ToString();
            return sig == IntegrationIntegrity.Hmac(raw, WebhookSecret)
                ? Results.Ok(new { ok = true })
                : Results.StatusCode(401);
        }));

    public static Task<WebApplication> WebhookBad() => Start(app =>
        app.MapPost("/webhook", async (HttpRequest req) =>
        {
            await Body(req); // accepts any signature
            return Results.Ok(new { ok = true });
        }));

    // ---- second-order-effects: notify both parties ----

    public static Task<WebApplication> NotifyGood() => Start(app =>
    {
        var inboxes = new Dictionary<string, List<string>> { ["host"] = [], ["guest"] = [] };
        app.MapPost("/book", () => { inboxes["host"].Add("booked"); inboxes["guest"].Add("booked"); return Results.Ok(); });
        app.MapGet("/inbox/{party}", (string party) => Results.Ok(inboxes.GetValueOrDefault(party) ?? []));
    });

    public static Task<WebApplication> NotifyBad() => Start(app =>
    {
        var inboxes = new Dictionary<string, List<string>> { ["host"] = [], ["guest"] = [] };
        app.MapPost("/book", () => { inboxes["host"].Add("booked"); return Results.Ok(); }); // forgets the guest
        app.MapGet("/inbox/{party}", (string party) => Results.Ok(inboxes.GetValueOrDefault(party) ?? []));
    });
}

/// <summary>Loads the neutral catalog copied next to the test assembly (see the .csproj link).</summary>
internal static class TestCatalog
{
    public static ProtocolCatalog Load() =>
        Catalog.Load(Path.Combine(AppContext.BaseDirectory, "catalog.json"));
}
