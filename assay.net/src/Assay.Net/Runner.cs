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
/// mechanical → run the body, pass unless it throws <see cref="AvpFailException"/>; no oracle → skip.
/// </summary>
public static class Runner
{
    /// <summary>
    /// Runs every criterion the catalog lists for <paramref name="archetype"/> against
    /// <paramref name="subject"/> and aggregates the <see cref="Verdict"/>. A criterion with no bound
    /// mechanical oracle is <c>Skipped</c> (never a false pass). Throws if the archetype is absent from
    /// the catalog (protocol drift).
    /// </summary>
    public static async Task<Verdict> Run<TSubject>(
        ProtocolCatalog catalog, Archetype<TSubject> archetype, string subjectName, TSubject subject)
    {
        var spec = catalog.Archetypes.FirstOrDefault(a => a.Archetype == archetype.Name)
                   ?? throw new InvalidOperationException(
                       $"Archetype '{archetype.Name}' is not in the catalog (protocol drift?).");

        var results = new List<CriterionVerdict>();
        foreach (var c in spec.Criteria)
        {
            if (c.Oracle != "mechanical" || !archetype.Oracles.TryGetValue(c.Id, out var oracle))
            {
                results.Add(new CriterionVerdict(c.Id, VerdictStatus.Skipped,
                    c.Oracle == "mechanical"
                        ? "no .NET oracle bound yet"
                        : $"oracle '{c.Oracle}' is not run by this adapter"));
                continue;
            }

            try
            {
                await oracle(subject);
                results.Add(new CriterionVerdict(c.Id, VerdictStatus.Pass, c.Statement));
            }
            catch (AvpSkipException ex)
            {
                results.Add(new CriterionVerdict(c.Id, VerdictStatus.Skipped, ex.Message));
            }
            catch (AvpFailException ex)
            {
                results.Add(new CriterionVerdict(c.Id, VerdictStatus.Fail, ex.Message));
            }
        }

        return new Verdict(subjectName, archetype.Name, results);
    }
}
