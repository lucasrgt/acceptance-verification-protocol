using System.Text.Json;
using Assay.Net.Archetypes;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Assay.Net.Tests;

public sealed class CredentialRefusalTests
{
    [Theory]
    [InlineData(500, null, VerdictStatus.Fail)]
    [InlineData(503, null, VerdictStatus.Fail)]
    [InlineData(302, null, VerdictStatus.Fail)]
    [InlineData(401, "leaked-session-token", VerdictStatus.Fail)]
    [InlineData(403, "leaked-session-token", VerdictStatus.Fail)]
    [InlineData(400, null, VerdictStatus.Pass)]
    [InlineData(401, null, VerdictStatus.Pass)]
    [InlineData(403, "", VerdictStatus.Pass)]
    public async Task a_refusal_is_a_client_error_without_a_token(int status, string? invalidToken, VerdictStatus expected)
    {
        await using var app = await Repro.Start(app => app.MapPost("/login", async (HttpRequest request) =>
        {
            using var body = JsonDocument.Parse(await Repro.Body(request));
            return body.RootElement.GetProperty("password").GetString() == "correct"
                ? Results.Ok(new { accessToken = "valid-session-token" })
                : Results.Json(new { accessToken = invalidToken }, statusCode: status);
        }));
        var verdict = await Runner.Run(TestCatalog.Load(), new CredentialAuthority(), "credential-refusal",
            new CredentialAuthoritySubject(app.BaseUrl(), "/login", new { password = "correct" }, new { password = "wrong" }));
        Assert.Equal(expected, verdict.Results.Single(result => result.CriterionId == "rejects-invalid-credentials").Status);
        Assert.Equal(VerdictStatus.Pass, verdict.Results.Single(result => result.CriterionId == "issues-token-on-valid").Status);
    }
}
