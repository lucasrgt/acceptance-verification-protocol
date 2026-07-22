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

/// <summary>Per-criterion outcome. Irrelevance and inability to decide are deliberately distinct.</summary>
public enum VerdictStatus
{
    /// <summary>The criterion held: the oracle ran without failing.</summary>
    Pass,

    /// <summary>The criterion was violated: the oracle threw <see cref="AvpFailException"/>.</summary>
    Fail,

    /// <summary>The criterion is provably irrelevant to this subject shape.</summary>
    NotApplicable,

    /// <summary>The criterion applies, but its required oracle or substrate could not decide it.</summary>
    Unresolved,
}

/// <summary>The aggregate decision for a subject against one archetype.</summary>
public enum VerdictOutcome
{
    /// <summary>Every decided criterion passed and no required criterion remains unresolved.</summary>
    Pass,

    /// <summary>At least one decided criterion failed.</summary>
    Fail,

    /// <summary>No criterion was decided, or a required criterion remains unresolved.</summary>
    Inconclusive,
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
    /// <summary>The archetype version whose criteria produced this verdict.</summary>
    public string ArchetypeVersion { get; init; } = "unknown";

    /// <summary>The AVP protocol version whose data model produced this verdict.</summary>
    public string ProtocolVersion { get; init; } = "0.4.0";

    /// <summary>Criteria actually decided as pass/fail — the denominator of the score.</summary>
    public int Applicable => Results.Count(r => r.Status is VerdictStatus.Pass or VerdictStatus.Fail);

    /// <summary>Criteria that passed — the numerator of the score.</summary>
    public int Passed => Results.Count(r => r.Status == VerdictStatus.Pass);

    /// <summary>Criteria that required a missing oracle, seam, or substrate.</summary>
    public int Unresolved => Results.Count(r => r.Status == VerdictStatus.Unresolved);

    /// <summary>Criteria proved irrelevant to this subject shape.</summary>
    public int NotApplicable => Results.Count(r => r.Status == VerdictStatus.NotApplicable);

    /// <summary>The fail-closed aggregate decision.</summary>
    public VerdictOutcome Outcome => Results.Any(r => r.Status == VerdictStatus.Fail)
        ? VerdictOutcome.Fail
        : Applicable == 0 || Unresolved > 0
            ? VerdictOutcome.Inconclusive
            : VerdictOutcome.Pass;

    /// <summary>passed / applicable, in [0,1], or null when no criterion was decided.</summary>
    public double? AcceptanceScore => Applicable == 0 ? null : (double)Passed / Applicable;

    /// <summary>Total wall-clock cost of the verification, in ms.</summary>
    public double DurationMs { get; init; }

    /// <summary>
    /// Enforces the fail-closed host policy: only a conclusive all-pass verdict is accepted.
    /// </summary>
    public void RequireAccepted()
    {
        if (Outcome == VerdictOutcome.Inconclusive || AcceptanceScore is null)
            throw new AvpGateException(
                $"Verification is inconclusive: applicable={Applicable}, unresolved={Unresolved}. No green verdict was produced.");
        if (Outcome == VerdictOutcome.Fail)
            throw new AvpGateException(
                $"Verification failed: {Results.Count(result => result.Status == VerdictStatus.Fail)} mandatory criterion/criteria failed.");
    }

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
            var existingDecided = existing.Status is VerdictStatus.Pass or VerdictStatus.Fail;
            var incomingDecided = r.Status is VerdictStatus.Pass or VerdictStatus.Fail;
            if (existingDecided && incomingDecided && existing.Status != r.Status)
                throw new InvalidOperationException(
                    $"Merge conflict on '{r.CriterionId}': one run says {existing.Status}, another {r.Status}.");
            if (!existingDecided && (incomingDecided
                || existing.Status == VerdictStatus.NotApplicable && r.Status == VerdictStatus.Unresolved))
                byCriterion[r.CriterionId] = r;
        }
        return new Verdict(head.Subject, head.Archetype, order.Select(id => byCriterion[id]).ToArray())
        {
            ArchetypeVersion = head.ArchetypeVersion,
            ProtocolVersion = head.ProtocolVersion,
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

/// <summary>Thrown when a mechanical criterion is provably irrelevant to the subject shape.</summary>
public sealed class AvpNotApplicableException(string reason) : Exception(reason);

/// <summary>Thrown when a required criterion cannot be decided by the configured substrate.</summary>
public sealed class AvpUnresolvedException(string reason) : Exception(reason);

/// <summary>Thrown by a host when a verdict cannot satisfy the configured acceptance policy.</summary>
public sealed class AvpGateException(string reason) : Exception(reason);
