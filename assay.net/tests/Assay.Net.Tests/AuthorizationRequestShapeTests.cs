using System.Collections.Concurrent;
using Assay.Net.Archetypes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Builder;

namespace Assay.Net.Tests;

public class AuthorizationRequestShapeTests
{
    [Theory]
    [InlineData(false, VerdictStatus.Pass)]
    [InlineData(true, VerdictStatus.Fail)]
    public async Task body_identified_post_commands_detect_ownership_and_role_bypasses(bool vulnerable, VerdictStatus expected)
    {
        var seen = new ConcurrentBag<(string Path, string? Token, string Id)>();
        await using var app = await Repro.Start(app =>
        {
            app.MapPost("/sessions/revoke", async (HttpRequest request) =>
            {
                var body = await request.ReadFromJsonAsync<SessionBody>();
                if (body?.SessionId is not ("mine" or "theirs")) return Results.BadRequest();
                var who = Repro.Bearer(request);
                seen.Add((request.Path, who, body.SessionId));
                if (who != "owner") return Results.Unauthorized();
                return vulnerable || body.SessionId == "mine" ? Results.Ok() : Results.NotFound();
            });
            app.MapPost("/admin/disable", async (HttpRequest request) =>
            {
                var body = await request.ReadFromJsonAsync<SessionBody>();
                if (body?.SessionId != "target") return Results.BadRequest();
                var who = Repro.Bearer(request);
                seen.Add((request.Path, who, body.SessionId));
                return vulnerable || who == "admin" ? Results.Ok() : Results.StatusCode(403);
            });
        });
        var subject = new AuthorizationSubject(app.BaseUrl(), "owner", "/sessions/revoke", "/sessions/revoke",
            "/admin/disable", "admin", "member")
        {
            ResourceMethod = HttpMethod.Post,
            OwnBody = new { sessionId = "mine" },
            OthersBody = new { sessionId = "theirs" },
            PrivilegedMethod = HttpMethod.Post,
            PrivilegedBody = new { sessionId = "target" },
        };
        var verdict = await Runner.Run(Catalog.LoadDefault(), new Authorization(), "post-commands", subject);
        Assert.Equal(expected, verdict.Results.Single(r => r.CriterionId == "own-resource-only").Status);
        Assert.Equal(expected, verdict.Results.Single(r => r.CriterionId == "role-required").Status);
        Assert.Equal(4, seen.Count);
        Assert.Contains(("/sessions/revoke", "owner", "mine"), seen);
        Assert.Contains(("/sessions/revoke", "owner", "theirs"), seen);
        Assert.Contains(("/admin/disable", "admin", "target"), seen);
        Assert.Contains(("/admin/disable", "member", "target"), seen);
    }

    [Fact]
    public async Task bodyless_delete_operations_keep_the_real_method_and_bearer_identity()
    {
        var seen = new ConcurrentBag<string>();
        await using var app = await Repro.Start(app =>
        {
            app.MapDelete("/sessions/{id}", (string id, HttpRequest request) =>
            {
                Assert.Equal(0, request.ContentLength ?? 0);
                Assert.Equal("owner", Repro.Bearer(request));
                seen.Add(id);
                return id == "mine" ? Results.Ok() : Results.NotFound();
            });
            app.MapDelete("/admin/record", (HttpRequest request) =>
            {
                Assert.Equal(0, request.ContentLength ?? 0);
                seen.Add(Repro.Bearer(request)!);
                return Repro.Bearer(request) == "admin" ? Results.Ok() : Results.StatusCode(403);
            });
        });
        var subject = new AuthorizationSubject(app.BaseUrl(), "owner", "/sessions/mine", "/sessions/theirs",
            "/admin/record", "admin", "member")
        {
            ResourceMethod = HttpMethod.Delete, OwnBody = null, OthersBody = null,
            PrivilegedMethod = HttpMethod.Delete,
        };
        var verdict = await Runner.Run(Catalog.LoadDefault(), new Authorization(), "bodyless-delete", subject);
        Assert.Equal(VerdictOutcome.Pass, verdict.Outcome);
        Assert.Equal(4, seen.Count);
        Assert.Contains("mine", seen);
        Assert.Contains("theirs", seen);
        Assert.Contains("admin", seen);
        Assert.Contains("member", seen);
    }

    private sealed record SessionBody(string SessionId);
}
