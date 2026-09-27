using System.Text.Json;
using Assay.Net.Archetypes;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Assay.Net.Tests;

public sealed class ProtocolRefusalTests
{
    [Theory]
    [InlineData(500, VerdictStatus.Fail)]
    [InlineData(302, VerdictStatus.Fail)]
    [InlineData(409, VerdictStatus.Pass)]
    public async Task duplicate_creation_requires_a_real_rejection(int secondStatus, VerdictStatus expected)
    {
        var count = 0;
        await using var app = await Repro.Start(app => app.MapPost("/create", () =>
            Results.StatusCode(++count == 1 ? 201 : secondStatus)));
        var verdict = await Runner.Run(TestCatalog.Load(), new ResourceUniqueness(), "unique-refusal",
            new ResourceUniquenessSubject(app.BaseUrl(), "/create", new { name = "unique" }));
        Assert.Equal(expected, verdict.Results.Single(result => result.CriterionId == "rejects-duplicate").Status);
    }

    [Theory]
    [InlineData(500, 401, VerdictStatus.Fail)]
    [InlineData(401, 500, VerdictStatus.Fail)]
    [InlineData(302, 401, VerdictStatus.Fail)]
    [InlineData(401, 302, VerdictStatus.Fail)]
    [InlineData(401, 401, VerdictStatus.Pass)]
    public async Task replay_and_family_burn_require_real_rejections(int replayStatus, int burnedStatus, VerdictStatus expected)
    {
        var sequence = 0;
        var spent = new HashSet<string>();
        await using var app = await Repro.Start(app =>
        {
            app.MapPost("/login", () => Results.Ok(new { refreshToken = $"initial-{++sequence}" }));
            app.MapPost("/refresh", async (HttpRequest request) =>
            {
                using var body = JsonDocument.Parse(await Repro.Body(request));
                var token = body.RootElement.GetProperty("refreshToken").GetString()!;
                if (token.StartsWith("rotated-", StringComparison.Ordinal)) return Results.StatusCode(burnedStatus);
                return spent.Add(token) ? Results.Ok(new { refreshToken = "rotated-" + token }) : Results.StatusCode(replayStatus);
            });
        });
        var verdict = await Runner.Run(TestCatalog.Load(), new TokenRotation(), "rotation-refusal",
            new TokenRotationSubject(app.BaseUrl(), "/login", new { user = "a" }, "/refresh"));
        Assert.Equal(expected, verdict.Results.Single(result => result.CriterionId == "replay-burns-family").Status);
        Assert.Equal(VerdictStatus.Pass, verdict.Results.Single(result => result.CriterionId == "rotates-on-refresh").Status);
    }
}
