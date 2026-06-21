using Assay.Net;

namespace Assay.Net.Tests;

/// <summary>
/// The package ships self-contained: a consumer calls <see cref="Catalog.LoadDefault"/> and gets the
/// neutral behaviour catalog embedded in the assembly — no path to the monorepo required.
/// </summary>
public class CatalogTests
{
    [Fact]
    public void LoadDefault_reads_the_embedded_catalog()
    {
        var catalog = Catalog.LoadDefault();

        Assert.Equal("AVP", catalog.Protocol);
        Assert.False(string.IsNullOrWhiteSpace(catalog.ProtocolVersion));
        Assert.NotEmpty(catalog.Archetypes);
        // The criteria the backend adapter proves must be present in the embedded copy.
        Assert.Contains(catalog.Archetypes, a => a.Archetype == "money-integrity");
        Assert.Contains(catalog.Archetypes.SelectMany(a => a.Criteria), c => c.Id == "split-invariant");
    }
}
