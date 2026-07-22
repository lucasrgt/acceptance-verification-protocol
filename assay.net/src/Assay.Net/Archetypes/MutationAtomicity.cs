namespace Assay.Net.Archetypes;

/// <summary>
/// Observable seams for concurrency conflicts and rollback after a forced mid-mutation fault.
/// Each request factory must return a fresh message because messages cannot be sent twice.
/// </summary>
/// <param name="BaseUrl">Server base URL; ignored when the runner supplies a transport.</param>
/// <param name="FirstConflictingUpdate">First update carrying the shared concurrency token.</param>
/// <param name="SecondConflictingUpdate">Conflicting update carrying the same token.</param>
/// <param name="FaultingMutation">A mutation configured to fail after its first internal write.</param>
/// <param name="ReadState">Reads the complete state that must remain unchanged around the fault.</param>
/// <param name="NormalizeState">Optional canonical projection used for state comparison.</param>
/// <param name="ConflictStatuses">Explicit statuses accepted for the losing update.</param>
public sealed record MutationAtomicitySubject(
    string BaseUrl,
    Func<HttpRequestMessage>? FirstConflictingUpdate = null,
    Func<HttpRequestMessage>? SecondConflictingUpdate = null,
    Func<HttpRequestMessage>? FaultingMutation = null,
    Func<HttpRequestMessage>? ReadState = null,
    Func<string, string>? NormalizeState = null,
    IReadOnlyCollection<int>? ConflictStatuses = null);

/// <summary>
/// Proves optimistic conflicts are visible and a failed multi-write operation leaves no
/// partial observable state. It complements static transaction posture with runtime evidence.
/// </summary>
public sealed class MutationAtomicity : Archetype<MutationAtomicitySubject>
{
    /// <inheritdoc/>
    public override string Name => "mutation-atomicity";

    /// <inheritdoc/>
    public override IReadOnlyDictionary<string, Func<MutationAtomicitySubject, Task>> Oracles { get; } =
        new Dictionary<string, Func<MutationAtomicitySubject, Task>>
        {
            ["concurrent-conflict-surfaces"] = async subject =>
            {
                if (subject.FirstConflictingUpdate is null || subject.SecondConflictingUpdate is null)
                    throw new AvpNotApplicableException(
                        "concurrent-conflict-surfaces: this subject provides no pair of conflicting updates.");
                using var http = Http.Client(subject.BaseUrl);
                var responses = await Task.WhenAll(
                    http.SendAsync(subject.FirstConflictingUpdate()),
                    http.SendAsync(subject.SecondConflictingUpdate()));
                var successes = responses.Count(response => response.IsSuccessStatusCode);
                var acceptedConflicts = subject.ConflictStatuses ?? [409, 412];
                var conflicts = responses.Count(response => acceptedConflicts.Contains((int)response.StatusCode));
                if (successes != 1 || conflicts != 1)
                    throw new AvpFailException(
                        $"concurrent conflict did not surface: statuses={string.Join(',', responses.Select(r => (int)r.StatusCode))}; " +
                        $"expected exactly one success and one explicit {string.Join('/', acceptedConflicts)} conflict.");
            },
            ["multi-write-is-atomic"] = async subject =>
            {
                if (subject.FaultingMutation is null || subject.ReadState is null)
                    throw new AvpNotApplicableException(
                        "multi-write-is-atomic: this subject provides no fault-and-state seam.");
                using var http = Http.Client(subject.BaseUrl);
                var before = await Read(http, subject);
                var fault = await http.SendAsync(subject.FaultingMutation());
                if (fault.IsSuccessStatusCode)
                    throw new AvpFailException(
                        $"the forced mid-mutation fault returned {(int)fault.StatusCode}; the fault scenario was not reached.");
                var after = await Read(http, subject);
                if (!string.Equals(before, after, StringComparison.Ordinal))
                    throw new AvpFailException(
                        $"a failed multi-write mutation left partial observable state: before={before}; after={after}.");
            },
        };

    private static async Task<string> Read(HttpClient http, MutationAtomicitySubject subject)
    {
        var response = await http.SendAsync(subject.ReadState!());
        Http.Accepted(response, "reading mutation state");
        var raw = await response.Content.ReadAsStringAsync();
        return subject.NormalizeState?.Invoke(raw) ?? raw;
    }
}
