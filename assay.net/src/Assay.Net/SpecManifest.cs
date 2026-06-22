namespace Assay.Net;

/// <summary>
/// The Clockwork acceptance manifest for a module (<c>&lt;Module&gt;.spec.toml</c>) — the neutral declaration BOTH
/// ends of the bridge read. The static doctor reads it to enforce a proof exists for every declared criterion;
/// Assay.Net reads it here to score a module's verdicts against the criteria the module actually DECLARES it must
/// hold (the manifest is the expected set; the <see cref="Verdict"/>s the proofs emit are the observed set).
/// </summary>
/// <param name="Module">The module name (the <c>module = "…"</c> key).</param>
/// <param name="Slices">Each declared slice mapped to the criterion ids it must prove.</param>
public sealed record SpecManifest(string Module, IReadOnlyDictionary<string, IReadOnlyList<string>> Slices)
{
    /// <summary>Every criterion id the manifest declares, across all slices (deduplicated, order-preserving).</summary>
    public IReadOnlyList<string> DeclaredCriteria =>
        Slices.Values.SelectMany(c => c).Distinct().ToArray();

    /// <summary>Reads and parses a <c>&lt;Module&gt;.spec.toml</c> from disk.</summary>
    public static SpecManifest Load(string path) => Parse(File.ReadAllText(path));

    /// <summary>
    /// Parses the manifest's known TOML shape — <c>module = "X"</c> plus <c>[slices.&lt;Name&gt;]</c> tables each
    /// carrying <c>criteria = ["a", "b"]</c>. Deliberately a focused reader for this controlled shape, not a general
    /// TOML parser: the manifest is a curated, doctor-enforced contract, not free-form config.
    /// </summary>
    public static SpecManifest Parse(string toml)
    {
        string module = "";
        var slices = new Dictionary<string, IReadOnlyList<string>>();
        string? currentSlice = null;

        foreach (var raw in toml.Split('\n'))
        {
            var line = StripComment(raw).Trim();
            if (line.Length == 0)
                continue;

            if (line.StartsWith("module", StringComparison.Ordinal) && line.Contains('='))
            {
                module = Unquote(line[(line.IndexOf('=') + 1)..].Trim());
                currentSlice = null;
            }
            else if (line.StartsWith("[slices.", StringComparison.Ordinal) && line.EndsWith(']'))
            {
                currentSlice = line["[slices.".Length..^1].Trim();
                slices[currentSlice] = Array.Empty<string>();
            }
            else if (currentSlice is not null && line.StartsWith("criteria", StringComparison.Ordinal) && line.Contains('='))
            {
                slices[currentSlice] = ParseList(line[(line.IndexOf('=') + 1)..]);
            }
        }

        if (string.IsNullOrEmpty(module))
            throw new FormatException("spec.toml has no 'module = \"…\"' key.");
        return new SpecManifest(module, slices);
    }

    private static string StripComment(string line)
    {
        // '#' starts a comment except inside a string; the manifest never puts '#' inside a value, so a plain
        // split is safe for this controlled shape.
        var hash = line.IndexOf('#');
        return hash < 0 ? line : line[..hash];
    }

    private static string Unquote(string s)
    {
        s = s.Trim();
        return s.Length >= 2 && s[0] == '"' && s[^1] == '"' ? s[1..^1] : s;
    }

    private static IReadOnlyList<string> ParseList(string rhs)
    {
        rhs = rhs.Trim();
        var open = rhs.IndexOf('[');
        var close = rhs.LastIndexOf(']');
        if (open < 0 || close < open)
            return Array.Empty<string>();
        var inner = rhs[(open + 1)..close];
        return inner.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(Unquote)
            .Where(s => s.Length > 0)
            .ToArray();
    }
}
