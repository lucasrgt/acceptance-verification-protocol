namespace Assay.Net;

/// <summary>
/// Marks a test/verification method (or class) as the AVP proof of a catalog criterion — the
/// <c>[Fact]</c> of AVP. It carries the production subject and criterion id from
/// <c>protocol/catalog.json</c>, making the proof an unambiguous subject × criterion claim.
///
/// This is the AVP half of the cross-layer bridge: the static doctor (AeroFortress.Framework) reads
/// it to enforce that every declared production element has a matching proof. AVP stays STANDALONE —
/// it knows nothing of the framework; the framework depends
/// on AVP, never the reverse, and recognizes this attribute by name in the user's compilation.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true, Inherited = false)]
public sealed class AVPAttribute : Attribute
{
    /// <summary>
    /// Creates a legacy criterion-only proof marker. New integrations should use
    /// <see cref="AVPAttribute(Type, string)"/> so one proof cannot accidentally satisfy another subject.
    /// </summary>
    /// <param name="criterionId">The stable catalog criterion id.</param>
    public AVPAttribute(string criterionId)
    {
        CriterionId = criterionId;
    }

    /// <summary>Creates a proof marker bound to one production subject and one catalog criterion.</summary>
    /// <param name="subjectType">The production type whose behaviour is being proven.</param>
    /// <param name="criterionId">The stable catalog criterion id.</param>
    public AVPAttribute(Type subjectType, string criterionId)
    {
        SubjectType = subjectType ?? throw new ArgumentNullException(nameof(subjectType));
        CriterionId = criterionId;
    }

    /// <summary>The production subject this verification proves, or <c>null</c> for a legacy marker.</summary>
    public Type? SubjectType { get; }

    /// <summary>The stable criterion id this verification proves (e.g. "own-resource-only").</summary>
    public string CriterionId { get; }
}
