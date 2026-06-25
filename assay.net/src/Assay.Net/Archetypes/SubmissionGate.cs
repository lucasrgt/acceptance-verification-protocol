using System.Net.Http.Json;

namespace Assay.Net.Archetypes;

/// <summary>
/// Seam for the submission-gate archetype: two submissions of the SAME well-formed body over one endpoint — one to
/// a resource whose precondition is MET (ready), one whose precondition is UNMET. The body-bearing sibling of
/// <see cref="LifecycleGate"/>: where a lifecycle transition is body-less, a submission carries a required payload,
/// so a body-less probe would be refused for the wrong reason (a 422 on the empty body, not the gate). <paramref name="Body"/>
/// is the payload well-formed enough for the ready resource to accept it.
/// </summary>
public sealed record SubmissionGateSubject(
    string BaseUrl,
    string ReadyTransitionPath,
    string UnmetTransitionPath,
    object Body);

/// <summary>
/// submission-gate — the server enforces the precondition of a body-bearing state change. The SAME well-formed
/// submission is accepted on a resource whose precondition is met and refused (4xx) on one whose precondition is
/// unmet. Distinct from <see cref="LifecycleGate"/>: that gate's transition is body-less, so it cannot bind a
/// mutation that REQUIRES a body — a body-less probe of such a slice fails the ready path on the missing body, not
/// the gate. Here the ready acceptance proves the body is well-formed, so the unmet refusal can only be the gate
/// firing on the precondition. A valid body is never a key past the gate.
/// </summary>
public sealed class SubmissionGate : Archetype<SubmissionGateSubject>
{
    /// <inheritdoc/>
    public override string Name => "submission-gate";

    /// <inheritdoc/>
    public override IReadOnlyDictionary<string, Func<SubmissionGateSubject, Task>> Oracles { get; } =
        new Dictionary<string, Func<SubmissionGateSubject, Task>>
        {
            ["gate-enforced-on-submission"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);

                // Precondition MET (ready): the well-formed submission must be accepted. This is also what proves
                // the body is well-formed — so the refusal on the unmet path below can only be the gate, never a
                // body the server would reject anyway.
                var ready = await http.SendAsync(Http.Request(HttpMethod.Post, s.ReadyTransitionPath, body: Payload(s)));
                Http.Accepted(ready, "a well-formed submission on a resource whose precondition is met (ready)");

                // Precondition UNMET: the IDENTICAL submission must be refused server-side (4xx). The body the ready
                // path just accepted is no key here — the gate fires on the precondition, not on the FE having hidden
                // the form.
                var unmet = await http.SendAsync(Http.Request(HttpMethod.Post, s.UnmetTransitionPath, body: Payload(s)));
                Http.Rejected(unmet, "the identical submission on a resource whose precondition is unmet — the server must refuse it (4xx), not trust the FE gate");
            },
        };

    // A fresh HttpContent per request: an HttpContent is consumed when sent, so the two submissions cannot share one.
    private static HttpContent Payload(SubmissionGateSubject s) => JsonContent.Create(s.Body, s.Body.GetType());
}
