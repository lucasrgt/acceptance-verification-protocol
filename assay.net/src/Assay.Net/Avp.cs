namespace Assay.Net;

/// <summary>
/// Marks a test/verification method (or class) as the AVP proof of a catalog criterion — the
/// <c>[Fact]</c> of AVP. It carries the criterion id from <c>protocol/catalog.json</c>.
///
/// This is the AVP half of the cross-layer bridge: the static doctor (AeroFortress.Framework) reads
/// it to enforce that every <c>[Critical]</c>/<c>[Journey]</c>/<c>[Verify]</c> production element has
/// a matching proof. AVP stays STANDALONE — it knows nothing of the framework; the framework depends
/// on AVP, never the reverse, and recognizes this attribute by name in the user's compilation.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true, Inherited = false)]
public sealed class AVPAttribute(string criterionId) : Attribute
{
    /// <summary>The stable criterion id this verification proves (e.g. "own-resource-only").</summary>
    public string CriterionId { get; } = criterionId;
}
