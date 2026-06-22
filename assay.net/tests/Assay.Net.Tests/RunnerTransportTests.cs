using System.Net;
using System.Text;
using Assay.Net.Archetypes;

namespace Assay.Net.Tests;

/// <summary>
/// The runner can drive an archetype's oracles over an injected transport instead of a real socket — what lets a
/// pilot prove a slice over its existing in-memory test host (WebApplicationFactory) with no real port. The
/// factory is invoked per oracle (one disposable client each, the <c>using</c> contract), and the oracles really
/// run against the injected client, not the subject's base url.
/// </summary>
public class RunnerTransportTests
{
    private static readonly ProtocolCatalog DefaultCatalog = Catalog.LoadDefault();

    // Stands in for an in-memory host's client: records the paths it is asked for and answers every call 200 with
    // a token. The base url it is bound to (http://test.local) is the injected one — never the subject's.
    private sealed class StubHandler : HttpMessageHandler
    {
        public List<string> Paths { get; } = [];

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Paths.Add(request.RequestUri!.AbsolutePath);
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"accessToken":"t"}""", Encoding.UTF8, "application/json"),
            });
        }
    }

    [Fact]
    public async Task a_supplied_transport_runs_the_oracles_over_the_injected_client()
    {
        var handler = new StubHandler();
        var subject = new CredentialAuthoritySubject("http://unused", "/login", new { ok = true }, new { ok = false });

        var verdict = await Runner.Run(DefaultCatalog, new CredentialAuthority(), "login", subject,
            transport: () => new HttpClient(handler, disposeHandler: false) { BaseAddress = new Uri("http://test.local") });

        // The injected client saw the calls — no socket was opened to the subject's (unroutable) base url.
        Assert.Contains("/login", handler.Paths);
        // The oracles really ran: a token-bearing 200 passes the happy criterion and, because this stub accepts
        // EVERY credential, fails the deny criterion — exactly the behaviour the injected client produced.
        Assert.Equal(VerdictStatus.Pass, verdict.Results.First(r => r.CriterionId == "issues-token-on-valid").Status);
        Assert.Equal(VerdictStatus.Fail, verdict.Results.First(r => r.CriterionId == "rejects-invalid-credentials").Status);
    }

    [Fact]
    public async Task the_transport_factory_is_invoked_once_per_oracle()
    {
        var handler = new StubHandler();
        var created = 0;
        var subject = new CredentialAuthoritySubject("http://unused", "/login", new { ok = true }, new { ok = false });

        await Runner.Run(DefaultCatalog, new CredentialAuthority(), "login", subject,
            transport: () =>
            {
                created++;
                return new HttpClient(handler, disposeHandler: false) { BaseAddress = new Uri("http://test.local") };
            });

        // credential-authority binds two oracles; each gets its own client to dispose (the per-oracle using).
        Assert.Equal(2, created);
    }
}
