using System.Diagnostics;

namespace Assay.Net;

/// <summary>
/// An AVP archetype implementation for a substrate: a name + a mechanical oracle per criterion id,
/// each driving a subject of type <typeparamref name="TSubject"/>. The archetype/criteria
/// DEFINITIONS live in the neutral catalog; this binds executable oracles to them — the adapter
/// contract from docs/PROTOCOL.md. A criterion with no oracle here is honestly <c>Skipped</c>.
/// </summary>
public abstract class Archetype<TSubject>
{
    /// <summary>The catalog archetype id this binds oracles to (e.g. "money-integrity").</summary>
    public abstract string Name { get; }

    /// <summary>criterion id → mechanical oracle (throws <see cref="AvpFailException"/> to fail).</summary>
    public abstract IReadOnlyDictionary<string, Func<TSubject, Task>> Oracles { get; }
}

/// <summary>
/// The substrate-neutral core runner: it loops the catalog's criteria for an archetype, runs each
/// bound oracle, and aggregates a <see cref="Verdict"/>. Faithful to the protocol's execution model —
/// mechanical → run the body, pass unless it throws <see cref="AvpFailException"/>; an UNEXPECTED
/// exception is a FAIL with the error as evidence (never an aborted run); no oracle → skip.
/// </summary>
public static class Runner
{
    /// <summary>
    /// Runs every criterion the catalog lists for <paramref name="archetype"/> against
    /// <paramref name="subject"/> and aggregates the <see cref="Verdict"/>. A criterion with no bound
    /// mechanical oracle is <c>Skipped</c> (never a false pass). Throws if the archetype is absent from
    /// the catalog (protocol drift).
    ///
    /// Pass <paramref name="transport"/> to run the oracles over an in-memory test host instead of a real
    /// socket: the factory's client (e.g. <c>WebApplicationFactory.CreateClient()</c>) is handed to every
    /// oracle for this run, so a proof reuses an app's existing test fixture with no real port and the
    /// subject's base url is immaterial. Omit it for the default — a real <see cref="HttpClient"/> per oracle
    /// bound to the subject's base url.
    ///
    /// <paramref name="onCriterion"/> reports each verdict as it lands (progress in long suites);
    /// <paramref name="cancellationToken"/> stops BETWEEN criteria (the verdict so far is discarded —
    /// cancellation is abandonment, not a partial verdict).
    /// </summary>
    public static async Task<Verdict> Run<TSubject>(
        ProtocolCatalog catalog, Archetype<TSubject> archetype, string subjectName, TSubject subject,
        Func<HttpClient>? transport = null,
        Action<CriterionVerdict>? onCriterion = null,
        CancellationToken cancellationToken = default)
    {
        using var _ = Http.UseTransport(transport);

        var spec = catalog.Archetypes.FirstOrDefault(a => a.Archetype == archetype.Name)
                   ?? throw new InvalidOperationException(
                       $"Archetype '{archetype.Name}' is not in the catalog (protocol drift?).");

        var total = Stopwatch.StartNew();
        var results = new List<CriterionVerdict>();
        foreach (var c in spec.Criteria)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (c.Oracle != "mechanical" || !archetype.Oracles.TryGetValue(c.Id, out var oracle))
            {
                var skipped = new CriterionVerdict(c.Id, VerdictStatus.Skipped,
                    c.Oracle == "mechanical"
                        ? "no .NET oracle bound yet"
                        : $"oracle '{c.Oracle}' is not run by this adapter");
                results.Add(skipped);
                onCriterion?.Invoke(skipped);
                continue;
            }

            var sw = Stopwatch.StartNew();
            CriterionVerdict verdict;
            try
            {
                await oracle(subject);
                verdict = new CriterionVerdict(c.Id, VerdictStatus.Pass, c.Statement, DurationMs: sw.Elapsed.TotalMilliseconds);
            }
            catch (AvpSkipException ex)
            {
                verdict = new CriterionVerdict(c.Id, VerdictStatus.Skipped, ex.Message, DurationMs: sw.Elapsed.TotalMilliseconds);
            }
            catch (AvpFailException ex)
            {
                verdict = new CriterionVerdict(c.Id, VerdictStatus.Fail, ex.Message, ex.Evidence, sw.Elapsed.TotalMilliseconds);
            }
            catch (OperationCanceledException)
            {
                throw; // cancellation is the caller's decision, never a criterion verdict
            }
            catch (Exception ex)
            {
                // Not an AvpFail: an infrastructure/logic error. Still a FAIL (the run must
                // always end in a Verdict — same contract as the TS core), with the error kept
                // as evidence so the cause is diagnosable.
                verdict = new CriterionVerdict(
                    c.Id,
                    VerdictStatus.Fail,
                    $"Unexpected error while verifying: {ex.Message}",
                    new { error = ex.Message, type = ex.GetType().FullName, stack = ex.StackTrace },
                    sw.Elapsed.TotalMilliseconds);
            }
            results.Add(verdict);
            onCriterion?.Invoke(verdict);
        }

        return new Verdict(subjectName, archetype.Name, results) { DurationMs = total.Elapsed.TotalMilliseconds };
    }
}
