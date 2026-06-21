using System.Text.Json;

namespace Assay.Net.Archetypes;

/// <summary>Seam for the pagination-integrity archetype: a list endpoint paged by <c>?page=&amp;size=</c>.</summary>
public sealed record PaginationIntegritySubject(string BaseUrl, string ListPath, int PageSize, int ExpectedTotal);

/// <summary>
/// pagination-integrity — paging through the entire list yields every item exactly once: the union of all
/// pages equals the full set. Nothing dropped at a page boundary, nothing duplicated across pages, nothing
/// stranded by an unstable sort.
/// </summary>
public sealed class PaginationIntegrity : Archetype<PaginationIntegritySubject>
{
    public override string Name => "pagination-integrity";

    public override IReadOnlyDictionary<string, Func<PaginationIntegritySubject, Task>> Oracles { get; } =
        new Dictionary<string, Func<PaginationIntegritySubject, Task>>
        {
            ["pages-cover-the-set"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);

                // Walk pages 1,2,3,... collecting every returned id, stopping when a page is short or empty.
                var collected = new List<string>();
                for (var page = 1; ; page++)
                {
                    var path = $"{s.ListPath}?page={page}&size={s.PageSize}";
                    using var res = await http.SendAsync(Http.Request(HttpMethod.Get, path));
                    Http.Accepted(res, $"GET page {page}");

                    var ids = await ReadIds(res, page);
                    collected.AddRange(ids);

                    if (ids.Count < s.PageSize) break; // short or empty page → end of the set
                }

                // No duplicates across pages.
                var distinct = collected.Distinct().ToList();
                if (distinct.Count != collected.Count)
                {
                    var dupes = collected.GroupBy(x => x).Where(g => g.Count() > 1).Select(g => g.Key);
                    throw new AvpFailException(
                        $"paging duplicated items across page boundaries: {collected.Count} ids returned but only " +
                        $"{distinct.Count} distinct (repeated: {string.Join(", ", dupes)}) — an unstable sort or " +
                        "off-by-one let items reappear on a later page.");
                }

                // Total count matches the full set.
                if (collected.Count != s.ExpectedTotal)
                    throw new AvpFailException(
                        $"paging dropped items: collected {collected.Count} ids but the full set has " +
                        $"{s.ExpectedTotal} — items were stranded at a page boundary.");

                // Coverage: the union must equal the full set 1..ExpectedTotal exactly.
                var expected = Enumerable.Range(1, s.ExpectedTotal).Select(n => n.ToString()).ToHashSet();
                var seen = distinct.ToHashSet();
                var missing = expected.Except(seen).ToList();
                var extra = seen.Except(expected).ToList();
                if (missing.Count > 0 || extra.Count > 0)
                    throw new AvpFailException(
                        "the union of all pages does not equal the full set 1.." + s.ExpectedTotal +
                        (missing.Count > 0 ? $" — dropped: {string.Join(", ", missing)}" : "") +
                        (extra.Count > 0 ? $" — unexpected: {string.Join(", ", extra)}" : "") + ".");
            },
        };

    private static async Task<List<string>> ReadIds(HttpResponseMessage res, int page)
    {
        var raw = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);
        if (doc.RootElement.ValueKind != JsonValueKind.Array)
            throw new AvpFailException($"GET page {page}: expected a JSON array of ids, got: {raw}.");

        var ids = new List<string>();
        foreach (var el in doc.RootElement.EnumerateArray())
        {
            var value = el.ValueKind == JsonValueKind.String ? el.GetString() : el.GetRawText();
            if (string.IsNullOrEmpty(value))
                throw new AvpFailException($"GET page {page}: an item had an empty id ({raw}).");
            ids.Add(value);
        }
        return ids;
    }
}
