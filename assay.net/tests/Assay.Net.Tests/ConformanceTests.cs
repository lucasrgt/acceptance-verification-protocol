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
        // Discovered by REFLECTION over the assembly: a new Archetype<T> is covered automatically,
        // so forgetting to list it here can never open a silent hole.
        var archetypeTypes = typeof(Runner).Assembly.GetTypes()
            .Where(t => t is { IsAbstract: false, IsClass: true }
                        && t.BaseType is { IsGenericType: true } b
                        && b.GetGenericTypeDefinition() == typeof(Archetype<>))
            .ToArray();
        Assert.NotEmpty(archetypeTypes);

        foreach (var type in archetypeTypes)
        {
            var instance = Activator.CreateInstance(type)!;
            var name = (string)type.GetProperty("Name")!.GetValue(instance)!;
            var oracles = (System.Collections.IDictionary)type.GetProperty("Oracles")!.GetValue(instance)!;

            var spec = Catalog.Archetypes.FirstOrDefault(a => a.Archetype == name);
            Assert.True(spec is not null, $"{type.Name}: archetype '{name}' is not in the catalog.");
            foreach (var id in oracles.Keys.Cast<string>())
                Assert.True(spec!.Criteria.Any(c => c.Id == id),
                    $"{type.Name}: oracle '{id}' has no matching criterion in catalog archetype '{name}'.");
        }
    }
}
