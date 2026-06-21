namespace Assay.Net.Archetypes;

/// <summary>
/// Seam for the lifecycle-gate archetype: two transition requests over the same endpoint — one on a
/// resource whose precondition is MET (ready), one whose precondition is UNMET (not ready). The FE
/// gate that hides the action is a courtesy; the server is the guard.
/// </summary>
public sealed record LifecycleGateSubject(
    string BaseUrl,
    string ReadyTransitionPath,
    string UnmetTransitionPath);

/// <summary>
/// lifecycle-gate — the server enforces the transition's precondition. A transition requested on a
/// resource whose precondition is unmet is refused (4xx); a ready resource's transition still succeeds.
/// </summary>
public sealed class LifecycleGate : Archetype<LifecycleGateSubject>
{
    /// <inheritdoc/>
    public override string Name => "lifecycle-gate";

    /// <inheritdoc/>
    public override IReadOnlyDictionary<string, Func<LifecycleGateSubject, Task>> Oracles { get; } =
        new Dictionary<string, Func<LifecycleGateSubject, Task>>
        {
            ["gate-enforced-server-side"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);

                // Precondition MET (e.g. a complete listing): the transition must still succeed.
                var ready = await http.SendAsync(Http.Request(HttpMethod.Post, s.ReadyTransitionPath));
                Http.Accepted(ready, "transition on a resource whose precondition is met (ready)");

                // Precondition UNMET (e.g. an incomplete listing): the server must refuse it (4xx),
                // not trust the FE gate to have hidden the action.
                var unmet = await http.SendAsync(Http.Request(HttpMethod.Post, s.UnmetTransitionPath));
                Http.Rejected(unmet, "transition on a resource whose precondition is unmet — the server must refuse it (4xx), not trust the FE gate");
            },
        };
}
