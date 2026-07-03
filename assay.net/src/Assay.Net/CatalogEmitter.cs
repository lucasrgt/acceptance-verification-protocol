using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;

namespace Assay.Net;

/// <summary>
/// The authority's pen: serializes a catalog from <see cref="CatalogSource"/> into the exact
/// canonical byte form of the committed <c>protocol/*.json</c> artifacts — 2-space indent,
/// stable field order, LF line ends, trailing newline. The CatalogSync drift guard asserts the
/// committed artifacts equal this emission, so the contract is reproducible to the byte from
/// the .NET source (and the JS implementation conforms to the artifact, not the other way).
/// </summary>
public static class CatalogEmitter
{
    /// <summary>Serializes a catalog to its canonical artifact text.</summary>
    public static string Canonical(ProtocolCatalog catalog)
    {
        using var buffer = new MemoryStream();
        using (var w = new Utf8JsonWriter(buffer, new JsonWriterOptions
               {
                   Indented = true,
                   NewLine = "\n",
                   Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
               }))
        {
            WriteCatalog(w, catalog);
        }
        return Encoding.UTF8.GetString(buffer.ToArray()) + "\n";
    }

    private static void WriteCatalog(Utf8JsonWriter w, ProtocolCatalog c)
    {
        w.WriteStartObject();
        w.WriteString("protocol", c.Protocol);
        w.WriteString("protocolVersion", c.ProtocolVersion);
        if (c.CatalogName is not null)
            w.WriteString("catalog", c.CatalogName);
        if (c.Substrates is not null)
            WriteStringArray(w, "substrates", c.Substrates);
        if (c.ConditionAxes is not null)
        {
            w.WritePropertyName("conditionAxes");
            w.WriteStartObject();
            foreach (var (axis, values) in c.ConditionAxes)
                WriteStringArray(w, axis, values);
            w.WriteEndObject();
        }
        WriteStringArray(w, "oracleKinds", c.OracleKinds);
        w.WritePropertyName("archetypes");
        w.WriteStartArray();
        foreach (var a in c.Archetypes)
            WriteArchetype(w, a);
        w.WriteEndArray();
        w.WriteEndObject();
    }

    private static void WriteArchetype(Utf8JsonWriter w, ArchetypeSpec a)
    {
        w.WriteStartObject();
        w.WriteString("archetype", a.Archetype);
        w.WriteString("version", a.Version);
        w.WritePropertyName("criteria");
        w.WriteStartArray();
        foreach (var c in a.Criteria)
            WriteCriterion(w, c);
        w.WriteEndArray();
        if (a.Description is not null)
            w.WriteString("description", a.Description);
        w.WriteEndObject();
    }

    private static void WriteCriterion(Utf8JsonWriter w, Criterion c)
    {
        w.WriteStartObject();
        w.WriteString("id", c.Id);
        w.WriteString("statement", c.Statement);
        w.WriteString("oracle", c.Oracle);
        w.WriteString("scope", c.Scope);
        w.WritePropertyName("condition");
        w.WriteStartObject();
        w.WriteString("id", c.Condition.Id);
        if (c.Condition.Params is not null)
            throw new NotSupportedException(
                $"criterion '{c.Id}' carries condition params — no catalog criterion uses them yet; extend the emitter (field order!) before introducing them.");
        w.WriteEndObject();
        if (c.Substrate is not null)
            w.WriteString("substrate", c.Substrate);
        if (c.Requires is not null)
            w.WriteString("requires", c.Requires);
        if (c.SeenIn is not null)
            WriteStringArray(w, "seenIn", c.SeenIn);
        w.WriteEndObject();
    }

    private static void WriteStringArray(Utf8JsonWriter w, string name, IEnumerable<string> values)
    {
        w.WritePropertyName(name);
        w.WriteStartArray();
        foreach (var v in values)
            w.WriteStringValue(v);
        w.WriteEndArray();
    }
}
