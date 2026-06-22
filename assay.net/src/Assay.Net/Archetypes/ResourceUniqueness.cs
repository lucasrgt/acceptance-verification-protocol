using System.Net.Http.Json;

namespace Assay.Net.Archetypes;

/// <summary>
/// Seam for the resource-uniqueness archetype: a create endpoint that enforces a unique key. <paramref name="Body"/>
/// is a create payload whose unique field (email, slug, …) must be rejected on a second, identical create.
/// <paramref name="Bearer"/> authenticates the request when the create requires it (omit for a public create).
/// </summary>
public sealed record ResourceUniquenessSubject(
    string BaseUrl,
    string CreatePath,
    object Body,
    string? Bearer = null);

/// <summary>
/// resource-uniqueness — a create endpoint enforces its unique key: the first create succeeds, and a second create
/// of the SAME unique key is rejected (a conflict), never silently duplicated. A silent duplicate breaks the
/// invariant the unique key exists to hold (e.g. one-human-one-account: a duplicate email makes login ambiguous).
/// </summary>
public sealed class ResourceUniqueness : Archetype<ResourceUniquenessSubject>
{
    /// <inheritdoc/>
    public override string Name => "resource-uniqueness";

    /// <inheritdoc/>
    public override IReadOnlyDictionary<string, Func<ResourceUniquenessSubject, Task>> Oracles { get; } =
        new Dictionary<string, Func<ResourceUniquenessSubject, Task>>
        {
            ["rejects-duplicate"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);

                // First create establishes the unique key — it must be accepted.
                var first = await http.SendAsync(Create(s));
                Http.Accepted(first, $"first create at {s.CreatePath}");

                // Second create of the SAME key must be rejected (a conflict) — never a 2xx that silently duplicates.
                var second = await http.SendAsync(Create(s));
                if (second.IsSuccessStatusCode)
                    throw new AvpFailException(
                        $"creating the same unique key twice was accepted ({(int)second.StatusCode}) at {s.CreatePath} — " +
                        "the second create must be rejected (conflict), never silently duplicated.");
            },
        };

    private static HttpRequestMessage Create(ResourceUniquenessSubject s) =>
        Http.Request(HttpMethod.Post, s.CreatePath, bearer: s.Bearer, body: JsonContent.Create(s.Body, s.Body.GetType()));
}
