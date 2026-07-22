using System.Text.Json;
using Assay.Net.Archetypes;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Assay.Net.Tests;

public sealed class SecurityCalibrationTests
{
    private static readonly ProtocolCatalog Catalog = TestCatalog.Load();

    private static VerdictStatus Status(Verdict verdict, string criterionId) =>
        verdict.Results.Single(result => result.CriterionId == criterionId).Status;

    private static Task<WebApplication> AccessServer(bool protectedEndpoint) => Repro.Start(app =>
        app.MapGet("/private", () => protectedEndpoint ? Results.Unauthorized() : Results.Ok(new { secret = true })));

    [Fact]
    public async Task requires_authentication_passes_the_protected_endpoint_and_fails_the_public_escape()
    {
        await using var good = await AccessServer(protectedEndpoint: true);
        await using var bad = await AccessServer(protectedEndpoint: false);
        var goodVerdict = await Runner.Run(Catalog, new AccessControl(), "access-good",
            new AccessControlSubject(good.BaseUrl(), "/private"));
        var badVerdict = await Runner.Run(Catalog, new AccessControl(), "access-bad",
            new AccessControlSubject(bad.BaseUrl(), "/private"));
        Assert.Equal(VerdictStatus.Pass, Status(goodVerdict, "requires-authentication"));
        Assert.Equal(VerdictStatus.Fail, Status(badVerdict, "requires-authentication"));
    }

    private static Task<WebApplication> CredentialServer(string variant) => Repro.Start(app =>
        app.MapPost("/login", async (HttpRequest request) =>
        {
            using var body = JsonDocument.Parse(await Repro.Body(request));
            var password = body.RootElement.GetProperty("password").GetString();
            if (variant == "accept-all") return Results.Ok(new { accessToken = "unsafe" });
            if (password != "correct") return Results.Unauthorized();
            return variant == "missing-token" ? Results.Ok(new { user = "u1" }) : Results.Ok(new { accessToken = "safe" });
        }));

    private static CredentialAuthoritySubject Credentials(WebApplication app) =>
        new(app.BaseUrl(), "/login", new { password = "correct" }, new { password = "wrong" });

    [Fact]
    public async Task credential_authority_calibrates_both_accept_and_deny_paths()
    {
        await using var good = await CredentialServer("good");
        await using var acceptAll = await CredentialServer("accept-all");
        await using var missingToken = await CredentialServer("missing-token");
        var goodVerdict = await Runner.Run(Catalog, new CredentialAuthority(), "credentials-good", Credentials(good));
        var acceptAllVerdict = await Runner.Run(Catalog, new CredentialAuthority(), "credentials-accept-all", Credentials(acceptAll));
        var missingVerdict = await Runner.Run(Catalog, new CredentialAuthority(), "credentials-missing-token", Credentials(missingToken));
        Assert.Equal(VerdictStatus.Pass, Status(goodVerdict, "rejects-invalid-credentials"));
        Assert.Equal(VerdictStatus.Pass, Status(goodVerdict, "issues-token-on-valid"));
        Assert.Equal(VerdictStatus.Fail, Status(acceptAllVerdict, "rejects-invalid-credentials"));
        Assert.Equal(VerdictStatus.Fail, Status(missingVerdict, "issues-token-on-valid"));
    }

    private static Task<WebApplication> UniquenessServer(bool rejectsDuplicate) => Repro.Start(app =>
    {
        var seen = new HashSet<string>();
        app.MapPost("/users", async (HttpRequest request) =>
        {
            using var body = JsonDocument.Parse(await Repro.Body(request));
            var email = body.RootElement.GetProperty("email").GetString()!;
            if (rejectsDuplicate && !seen.Add(email)) return Results.Conflict();
            seen.Add(email);
            return Results.Created("/users/1", new { email });
        });
    });

    [Fact]
    public async Task rejects_duplicate_passes_the_unique_store_and_fails_silent_duplication()
    {
        await using var good = await UniquenessServer(rejectsDuplicate: true);
        await using var bad = await UniquenessServer(rejectsDuplicate: false);
        var goodSubject = new ResourceUniquenessSubject(good.BaseUrl(), "/users", new { email = "a@example.test" });
        var badSubject = new ResourceUniquenessSubject(bad.BaseUrl(), "/users", new { email = "a@example.test" });
        var goodVerdict = await Runner.Run(Catalog, new ResourceUniqueness(), "unique-good", goodSubject);
        var badVerdict = await Runner.Run(Catalog, new ResourceUniqueness(), "unique-bad", badSubject);
        Assert.Equal(VerdictStatus.Pass, Status(goodVerdict, "rejects-duplicate"));
        Assert.Equal(VerdictStatus.Fail, Status(badVerdict, "rejects-duplicate"));
    }

    private sealed class TokenFamily(string current)
    {
        public string Current { get; set; } = current;
        public HashSet<string> Spent { get; } = [];
        public bool Burned { get; set; }
    }

    private static Task<WebApplication> TokenServer(string variant) => Repro.Start(app =>
    {
        var sequence = 0;
        var families = new List<TokenFamily>();
        app.MapPost("/login", () =>
        {
            var token = $"initial-{++sequence}";
            families.Add(new TokenFamily(token));
            return Results.Ok(new { refreshToken = token });
        });
        app.MapPost("/refresh", async (HttpRequest request) =>
        {
            using var body = JsonDocument.Parse(await Repro.Body(request));
            var token = body.RootElement.GetProperty("refreshToken").GetString()!;
            var family = families.SingleOrDefault(candidate => candidate.Current == token || candidate.Spent.Contains(token));
            if (family is null || family.Burned) return Results.Unauthorized();
            if (family.Spent.Contains(token))
            {
                if (variant != "no-family-burn") family.Burned = true;
                return Results.Unauthorized();
            }
            if (variant == "same-token") return Results.Ok(new { refreshToken = token });
            family.Spent.Add(token);
            family.Current = $"rotated-{++sequence}";
            return Results.Ok(new { refreshToken = family.Current });
        });
    });

    private static TokenRotationSubject Tokens(WebApplication app) =>
        new(app.BaseUrl(), "/login", new { user = "u1" }, "/refresh");

    [Fact]
    public async Task token_rotation_calibrates_rotation_and_family_burn()
    {
        await using var good = await TokenServer("good");
        await using var same = await TokenServer("same-token");
        await using var noBurn = await TokenServer("no-family-burn");
        var goodVerdict = await Runner.Run(Catalog, new TokenRotation(), "tokens-good", Tokens(good));
        var sameVerdict = await Runner.Run(Catalog, new TokenRotation(), "tokens-same", Tokens(same));
        var noBurnVerdict = await Runner.Run(Catalog, new TokenRotation(), "tokens-no-burn", Tokens(noBurn));
        Assert.Equal(VerdictStatus.Pass, Status(goodVerdict, "rotates-on-refresh"));
        Assert.Equal(VerdictStatus.Pass, Status(goodVerdict, "replay-burns-family"));
        Assert.Equal(VerdictStatus.Fail, Status(sameVerdict, "rotates-on-refresh"));
        Assert.Equal(VerdictStatus.Fail, Status(noBurnVerdict, "replay-burns-family"));
    }
}
