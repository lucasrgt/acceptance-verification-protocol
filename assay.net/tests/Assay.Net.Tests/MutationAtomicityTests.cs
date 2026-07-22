using System.Net.Http.Headers;
using Assay.Net.Archetypes;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Assay.Net.Tests;

public sealed class MutationAtomicityTests
{
    private static readonly ProtocolCatalog Catalog = TestCatalog.Load();

    private static async Task<WebApplication> ConflictServer(bool guardsVersion)
    {
        var version = "\"v1\"";
        var sync = new object();
        return await Repro.Start(app => app.MapPut("/resource", (HttpRequest request) =>
        {
            lock (sync)
            {
                if (guardsVersion && request.Headers.IfMatch.ToString() != version)
                    return Results.StatusCode(412);
                version = "\"v2\"";
                return Results.Ok();
            }
        }));
    }

    private static async Task<WebApplication> AtomicServer(bool rollsBack)
    {
        var primary = "original";
        const string secondary = "original";
        return await Repro.Start(app =>
        {
            app.MapPost("/fault", () =>
            {
                primary = "partial";
                if (rollsBack) primary = "original";
                return Results.StatusCode(500);
            });
            app.MapGet("/state", () => Results.Ok(new { primary, secondary }));
        });
    }

    private static Func<HttpRequestMessage> Update(string value) => () =>
    {
        var request = Http.Request(HttpMethod.Put, "/resource", body: new StringContent($$"""{"value":"{{value}}"}"""));
        request.Headers.IfMatch.Add(new EntityTagHeaderValue("\"v1\""));
        return request;
    };

    private static MutationAtomicitySubject ConflictSubject(WebApplication app) =>
        new(app.BaseUrl(), Update("a"), Update("b"));

    private static MutationAtomicitySubject AtomicSubject(WebApplication app) =>
        new(app.BaseUrl(),
            FaultingMutation: () => Http.Request(HttpMethod.Post, "/fault"),
            ReadState: () => Http.Request(HttpMethod.Get, "/state"));

    private static VerdictStatus Status(Verdict verdict, string criterionId) =>
        verdict.Results.Single(result => result.CriterionId == criterionId).Status;

    [Fact]
    public async Task concurrent_conflict_passes_when_exactly_one_same_token_update_wins()
    {
        await using var app = await ConflictServer(guardsVersion: true);
        var verdict = await Runner.Run(Catalog, new MutationAtomicity(), "conflict-good", ConflictSubject(app));
        Assert.Equal(VerdictStatus.Pass, Status(verdict, "concurrent-conflict-surfaces"));
    }

    [Fact]
    public async Task concurrent_conflict_fails_silent_last_write_wins()
    {
        await using var app = await ConflictServer(guardsVersion: false);
        var verdict = await Runner.Run(Catalog, new MutationAtomicity(), "conflict-bad", ConflictSubject(app));
        Assert.Equal(VerdictStatus.Fail, Status(verdict, "concurrent-conflict-surfaces"));
    }

    [Fact]
    public async Task multi_write_passes_when_the_forced_fault_rolls_back_every_write()
    {
        await using var app = await AtomicServer(rollsBack: true);
        var verdict = await Runner.Run(Catalog, new MutationAtomicity(), "atomic-good", AtomicSubject(app));
        Assert.Equal(VerdictStatus.Pass, Status(verdict, "multi-write-is-atomic"));
    }

    [Fact]
    public async Task multi_write_fails_when_partial_state_survives_the_fault()
    {
        await using var app = await AtomicServer(rollsBack: false);
        var verdict = await Runner.Run(Catalog, new MutationAtomicity(), "atomic-bad", AtomicSubject(app));
        Assert.Equal(VerdictStatus.Fail, Status(verdict, "multi-write-is-atomic"));
    }
}
