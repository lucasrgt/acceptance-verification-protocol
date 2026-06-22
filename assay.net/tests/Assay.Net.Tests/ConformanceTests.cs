using Assay.Net;
using Assay.Net.Archetypes;

namespace Assay.Net.Tests;

/// <summary>
/// Conformance: Assay.Net consumes the SAME neutral catalog as the JS reference, and the criteria it
/// binds genuinely exist in that catalog (no drift between adapter and contract).
/// </summary>
public class ConformanceTests
{
    private static readonly ProtocolCatalog Catalog = TestCatalog.Load();

    [Fact]
    public void consumes_the_neutral_catalog()
    {
        Assert.Equal("AVP", Catalog.Protocol);
        Assert.False(string.IsNullOrWhiteSpace(Catalog.ProtocolVersion));
        Assert.NotEmpty(Catalog.Archetypes);
    }

    [Theory]
    [InlineData("authorization", "own-resource-only")]
    [InlineData("authorization", "role-required")]
    [InlineData("integration-integrity", "webhook-signature-verified")]
    [InlineData("second-order-effects", "notifies-all-parties")]
    public void bound_criteria_exist_in_the_catalog(string archetype, string criterionId)
    {
        var spec = Catalog.Archetypes.FirstOrDefault(a => a.Archetype == archetype);
        Assert.NotNull(spec);
        Assert.Contains(spec!.Criteria, c => c.Id == criterionId);
    }

    [Fact]
    public void every_bound_oracle_targets_a_real_catalog_criterion()
    {
        // No oracle may bind a criterion id absent from the catalog — that would be silent drift.
        AssertOraclesExist(new Authorization().Name, new Authorization().Oracles.Keys);
        AssertOraclesExist(new IntegrationIntegrity().Name, new IntegrationIntegrity().Oracles.Keys);
        AssertOraclesExist(new SecondOrderEffects().Name, new SecondOrderEffects().Oracles.Keys);
        AssertOraclesExist(new CredentialAuthority().Name, new CredentialAuthority().Oracles.Keys);
        AssertOraclesExist(new TokenRotation().Name, new TokenRotation().Oracles.Keys);
        AssertOraclesExist(new ResourceUniqueness().Name, new ResourceUniqueness().Oracles.Keys);
    }

    private static void AssertOraclesExist(string archetype, IEnumerable<string> oracleIds)
    {
        var spec = Catalog.Archetypes.First(a => a.Archetype == archetype);
        foreach (var id in oracleIds)
            Assert.Contains(spec.Criteria, c => c.Id == id);
    }
}
