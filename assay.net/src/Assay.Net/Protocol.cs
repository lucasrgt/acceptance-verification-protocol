namespace Assay.Net;

// The AVP data model — the portable shapes from docs/PROTOCOL.md, deserialized from the
// neutral catalog (protocol/catalog.json). Assay.Net CONSUMES this contract; it does not own it.

/// <summary>The machine-readable AVP catalog: the neutral, language-agnostic source of truth.</summary>
public sealed record ProtocolCatalog(
    string Protocol,
    string ProtocolVersion,
    IReadOnlyList<string> OracleKinds,
    IReadOnlyList<ArchetypeSpec> Archetypes);

/// <summary>A reusable feature class with its versioned set of criteria.</summary>
public sealed record ArchetypeSpec(
    string Archetype,
    string Version,
    IReadOnlyList<Criterion> Criteria);

/// <summary>A checkable acceptance statement — the unit of "done".</summary>
public sealed record Criterion(
    string Id,
    string Statement,
    string Oracle,
    string Scope,
    Condition Condition,
    string? Substrate = null);

/// <summary>An abstract precondition forced before observing (success, api-error, …).</summary>
public sealed record Condition(string Id);

/// <summary>Per-criterion outcome. `Skipped` never counts toward the score — a false green is the catastrophic error.</summary>
public enum VerdictStatus { Pass, Fail, Skipped }

/// <summary>The per-criterion verdict: status + an actionable reason (written for the agent to fix) + optional evidence.</summary>
public sealed record CriterionVerdict(string CriterionId, VerdictStatus Status, string Reason, object? Evidence = null);

/// <summary>The aggregate verdict for a subject against one archetype.</summary>
public sealed record Verdict(string Subject, string Archetype, IReadOnlyList<CriterionVerdict> Results)
{
    public int Applicable => Results.Count(r => r.Status != VerdictStatus.Skipped);
    public int Passed => Results.Count(r => r.Status == VerdictStatus.Pass);

    /// <summary>passed / applicable, in [0,1] (skipped excluded); 1.0 when nothing applies.</summary>
    public double AcceptanceScore => Applicable == 0 ? 1.0 : (double)Passed / Applicable;
}

/// <summary>Thrown by a mechanical oracle to FAIL a criterion with an actionable reason.</summary>
public sealed class AvpFailException(string reason) : Exception(reason);

/// <summary>Thrown by a mechanical oracle to SKIP a criterion whose seam/precondition this subject does not
/// provide — honest non-applicability, never a false pass.</summary>
public sealed class AvpSkipException(string reason) : Exception(reason);
