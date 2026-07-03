using System.Text.Json.Serialization;

namespace Assay.Net;

// The AVP data model — the portable shapes from docs/PROTOCOL.md. Since the authority
// handover (2026-07-02) the .NET side OWNS the contract: the neutral catalogs are emitted
// from CatalogSource via CatalogEmitter; this model is the schema they are emitted through.

/// <summary>The machine-readable AVP catalog: the neutral, language-agnostic source of truth.
/// <paramref name="CatalogName"/> + <paramref name="Substrates"/> are the DESIGN catalog's
/// root fields (absent on the behaviour catalog) — carried so the model is lossless.</summary>
public sealed record ProtocolCatalog(
    string Protocol,
    string ProtocolVersion,
    IReadOnlyList<string> OracleKinds,
    IReadOnlyList<ArchetypeSpec> Archetypes,
    IReadOnlyDictionary<string, IReadOnlyList<string>>? ConditionAxes = null,
    [property: JsonPropertyName("catalog")] string? CatalogName = null,
    IReadOnlyList<string>? Substrates = null);

/// <summary>A reusable feature class with its versioned set of criteria.</summary>
public sealed record ArchetypeSpec(
    string Archetype,
    string Version,
    IReadOnlyList<Criterion> Criteria,
    string? Description = null);

/// <summary>A checkable acceptance statement — the unit of "done".</summary>
public sealed record Criterion(
    string Id,
    string Statement,
    string Oracle,
    string Scope,
    Condition Condition,
    string? Substrate = null,
    string? Requires = null,
    IReadOnlyList<string>? SeenIn = null);

/// <summary>An abstract precondition forced before observing (success, api-error, …).</summary>
public sealed record Condition(string Id, IReadOnlyDictionary<string, object?>? Params = null);

/// <summary>Per-criterion outcome. `Skipped` never counts toward the score — a false green is the catastrophic error.</summary>
public enum VerdictStatus
{
    /// <summary>The criterion held: the oracle ran without failing.</summary>
    Pass,

    /// <summary>The criterion was violated: the oracle threw <see cref="AvpFailException"/>.</summary>
    Fail,

    /// <summary>Not applicable to this subject (no seam / no bound oracle) — excluded from the score, never a pass.</summary>
    Skipped,
}

/// <summary>The per-criterion verdict: status + an actionable reason (written for the agent to fix) + optional evidence.</summary>
public sealed record CriterionVerdict(
    string CriterionId,
    VerdictStatus Status,
    string Reason,
    object? Evidence = null,
    double? DurationMs = null);

/// <summary>The aggregate verdict for a subject against one archetype.</summary>
public sealed record Verdict(string Subject, string Archetype, IReadOnlyList<CriterionVerdict> Results)
{
    /// <summary>Criteria that actually applied (not skipped) — the denominator of the score.</summary>
    public int Applicable => Results.Count(r => r.Status != VerdictStatus.Skipped);

    /// <summary>Criteria that passed — the numerator of the score.</summary>
    public int Passed => Results.Count(r => r.Status == VerdictStatus.Pass);

    /// <summary>passed / applicable, in [0,1] (skipped excluded); 1.0 when nothing applies — check <see cref="Applicable"/> to tell a real green from a vacuous one.</summary>
    public double AcceptanceScore => Applicable == 0 ? 1.0 : (double)Passed / Applicable;

    /// <summary>Total wall-clock cost of the verification, in ms.</summary>
    public double DurationMs { get; init; }

    /// <summary>
    /// Merges verdicts for the SAME subject+archetype whose oracles were bound by different
    /// implementations (e.g. the two submission-gate variants): per criterion, a decided
    /// result (pass/fail) wins over a skip; conflicting decided results throw — that is a
    /// calibration bug, never something to silently pick from.
    /// </summary>
    public static Verdict Merge(params Verdict[] verdicts)
    {
        if (verdicts.Length == 0)
            throw new ArgumentException("Merge needs at least one verdict.", nameof(verdicts));
        var head = verdicts[0];
        if (verdicts.Any(v => v.Subject != head.Subject || v.Archetype != head.Archetype))
            throw new ArgumentException("Merge only combines verdicts for the same subject and archetype.");

        var byCriterion = new Dictionary<string, CriterionVerdict>();
        var order = new List<string>();
        foreach (var r in verdicts.SelectMany(v => v.Results))
        {
            if (!byCriterion.TryGetValue(r.CriterionId, out var existing))
            {
                byCriterion[r.CriterionId] = r;
                order.Add(r.CriterionId);
                continue;
            }
            var existingDecided = existing.Status != VerdictStatus.Skipped;
            var incomingDecided = r.Status != VerdictStatus.Skipped;
            if (existingDecided && incomingDecided && existing.Status != r.Status)
                throw new InvalidOperationException(
                    $"Merge conflict on '{r.CriterionId}': one run says {existing.Status}, another {r.Status}.");
            if (!existingDecided && incomingDecided)
                byCriterion[r.CriterionId] = r;
        }
        return new Verdict(head.Subject, head.Archetype, order.Select(id => byCriterion[id]).ToArray())
        {
            DurationMs = verdicts.Sum(v => v.DurationMs),
        };
    }
}

/// <summary>Thrown by a mechanical oracle to FAIL a criterion with an actionable reason (+ optional evidence for the verdict).</summary>
public sealed class AvpFailException(string reason, object? evidence = null) : Exception(reason)
{
    /// <summary>Evidence attached to the failing verdict (statuses, bodies, ids…).</summary>
    public object? Evidence { get; } = evidence;
}

/// <summary>Thrown by a mechanical oracle to SKIP a criterion whose seam/precondition this subject does not
/// provide — honest non-applicability, never a false pass.</summary>
public sealed class AvpSkipException(string reason) : Exception(reason);
