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

    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    /// <summary>
    /// Loads the behaviour catalog embedded in this package — the default, self-contained source so a
    /// consumer needs no path to the monorepo. Use <see cref="Load"/> to verify against a specific or
    /// newer catalog on disk.
    /// </summary>
    public static ProtocolCatalog LoadDefault()
    {
        using var stream = typeof(Catalog).Assembly.GetManifestResourceStream(EmbeddedCatalogName)
            ?? throw new InvalidOperationException(
                $"The embedded AVP catalog '{EmbeddedCatalogName}' is missing from the assembly.");
        return JsonSerializer.Deserialize<ProtocolCatalog>(stream, Options)
               ?? throw new InvalidOperationException("Could not parse the embedded AVP catalog.");
    }

    /// <summary>Loads the neutral catalog from a <c>protocol/catalog.json</c> file on disk.</summary>
    public static ProtocolCatalog Load(string path)
    {
        var json = File.ReadAllText(path);
        return JsonSerializer.Deserialize<ProtocolCatalog>(json, Options)
               ?? throw new InvalidOperationException($"Could not parse the AVP catalog at {path}");
    }
}
