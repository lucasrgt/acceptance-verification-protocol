using Assay.Net.Archetypes;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Assay.Net.Tests;

public sealed class FailureHonestyTests
{
    private static readonly ProtocolCatalog Catalog = TestCatalog.Load();

    private static Task<WebApplication> Server(bool phantomSuccess) => Repro.Start(app =>
        app.MapPost("/send", () => phantomSuccess
            ? Results.Ok(new { ok = true })
            : Results.Json(new { error = "mail delivery failed" }, statusCode: 502)));

    private static FailureHonestySubject Subject(WebApplication app) =>
        new(app.BaseUrl(), () => Http.Request(HttpMethod.Post, "/send"));

    private static VerdictStatus Status(Verdict verdict) => verdict.Results
        .Single(result => result.CriterionId == "dependency-failure-is-admitted").Status;

    [Fact]
    public async Task dependency_failure_passes_when_the_operation_admits_it()
    {
        await using var app = await Server(phantomSuccess: false);
        var verdict = await Runner.Run(Catalog, new FailureHonesty(), "failure-good", Subject(app));
        Assert.Equal(VerdictStatus.Pass, Status(verdict));
    }

    [Fact]
    public async Task dependency_failure_fails_a_bare_phantom_success()
    {
        await using var app = await Server(phantomSuccess: true);
        var verdict = await Runner.Run(Catalog, new FailureHonesty(), "failure-bad", Subject(app));
        Assert.Equal(VerdictStatus.Fail, Status(verdict));
    }
}
