using System.Text;
using Assay.Net;

namespace Assay.Net.Tests;

/// <summary>
/// The authority drift guard — since the handover (2026-07-02) the neutral catalogs are
/// EMITTED from <see cref="CatalogSource"/>: this side owns the contract, the JS adapter
/// conforms to the committed artifact (its guard flipped to content conformance).
/// A change to CatalogSource without regenerating the artifacts goes RED here; regenerate:
/// <c>ASSAY_WRITE_PROTOCOL=1 dotnet test --filter CatalogSync</c> (from assay.net/).
/// </summary>
public class CatalogSyncTests
{
    public static readonly TheoryData<string> Files = new() { "catalog.json", "design-catalog.json" };

    private static ProtocolCatalog Source(string file) =>
        file == "catalog.json" ? CatalogSource.Behaviour : CatalogSource.Design;

    [Theory]
    [MemberData(nameof(Files))]
    public void the_committed_artifact_is_emitted_from_the_dotnet_source(string file)
    {
        var path = Path.Combine(ProtocolDir(), file);
        var built = CatalogEmitter.Canonical(Source(file));
        if (Environment.GetEnvironmentVariable("ASSAY_WRITE_PROTOCOL") == "1")
            File.WriteAllText(path, built, new UTF8Encoding(false));
        // CRLF-normalized so an autocrlf checkout compares content, not checkout policy.
        var onDisk = File.ReadAllText(path).Replace("\r\n", "\n");
        Assert.Equal(built, onDisk);
    }

    [Theory]
    [MemberData(nameof(Files))]
    public void the_model_is_lossless_over_the_embedded_artifact(string file)
    {
        // Round-trip identity: embedded JSON → model → canonical emission must equal the
        // source's emission. A field the model cannot carry would vanish here and go red —
        // the schema authority is the C# model, provably.
        var embedded = file == "catalog.json" ? Catalog.LoadDefault() : Catalog.LoadDesignDefault();
        Assert.Equal(CatalogEmitter.Canonical(Source(file)), CatalogEmitter.Canonical(embedded));
    }

    private static string ProtocolDir()
    {
        for (var dir = new DirectoryInfo(AppContext.BaseDirectory); dir is not null; dir = dir.Parent!)
        {
            var candidate = Path.Combine(dir.FullName, "protocol");
            if (File.Exists(Path.Combine(candidate, "catalog.json")))
                return candidate;
        }
        throw new InvalidOperationException("protocol/catalog.json not found above the test binary — run from the monorepo.");
    }
}
