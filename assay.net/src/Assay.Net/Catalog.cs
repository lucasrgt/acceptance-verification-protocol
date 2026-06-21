using System.Text.Json;

namespace Assay.Net;

/// <summary>
/// Loads the neutral AVP catalog (protocol/catalog.json). The catalog is the shared source of
/// truth both implementations conform to; this adapter reads it, it never owns it.
/// </summary>
public static class Catalog
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public static ProtocolCatalog Load(string path)
    {
        var json = File.ReadAllText(path);
        return JsonSerializer.Deserialize<ProtocolCatalog>(json, Options)
               ?? throw new InvalidOperationException($"Could not parse the AVP catalog at {path}");
    }
}
