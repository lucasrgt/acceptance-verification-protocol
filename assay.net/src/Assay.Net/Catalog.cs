using System.Reflection;
using System.Text.Json;

namespace Assay.Net;

/// <summary>
/// Loads the neutral AVP catalog (protocol/catalog.json). The catalog is the shared source of
/// truth both implementations conform to; this adapter reads it, it never owns it.
/// </summary>
public static class Catalog
{
    private const string EmbeddedCatalogName = "Assay.Net.catalog.json";
    private const string EmbeddedDesignCatalogName = "Assay.Net.design-catalog.json";

    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private static ProtocolCatalog LoadEmbedded(string name)
    {
        using var stream = typeof(Catalog).Assembly.GetManifestResourceStream(name)
            ?? throw new InvalidOperationException(
                $"The embedded AVP catalog '{name}' is missing from the assembly.");
        return JsonSerializer.Deserialize<ProtocolCatalog>(stream, Options)
               ?? throw new InvalidOperationException($"Could not parse the embedded AVP catalog '{name}'.");
    }

    /// <summary>
    /// Loads the behaviour catalog embedded in this package — the default, self-contained source so a
    /// consumer needs no path to the monorepo. Use <see cref="Load"/> to verify against a specific or
    /// newer catalog on disk.
    /// </summary>
    public static ProtocolCatalog LoadDefault() => LoadEmbedded(EmbeddedCatalogName);

    /// <summary>
    /// Loads the DESIGN catalog embedded in this package (protocol/design-catalog.json) — the design
    /// tier's definitions, so a future .NET design adapter (or any consumer that wants the criteria
    /// list) reads the same neutral contract. No .NET design oracles are bound yet — running these
    /// archetypes through <see cref="Runner"/> yields honest Skips.
    /// </summary>
    public static ProtocolCatalog LoadDesignDefault() => LoadEmbedded(EmbeddedDesignCatalogName);

    /// <summary>Loads the neutral catalog from a <c>protocol/catalog.json</c> file on disk.</summary>
    public static ProtocolCatalog Load(string path)
    {
        var json = File.ReadAllText(path);
        return JsonSerializer.Deserialize<ProtocolCatalog>(json, Options)
               ?? throw new InvalidOperationException($"Could not parse the AVP catalog at {path}");
    }
}
