using System.Net.Http.Json;
using System.Text.Json;

namespace Assay.Net.Archetypes;

/// <summary>Seam for the request-idempotency archetype: a create endpoint that honors an Idempotency-Key header.</summary>
public sealed record RequestIdempotencySubject(string BaseUrl, string CreatePath);

/// <summary>
/// request-idempotency — a mutation carrying an idempotency key is applied at most once: two requests
/// with the SAME key yield one resource (the original, replayed); a DIFFERENT key yields a distinct one.
/// </summary>
public sealed class RequestIdempotency : Archetype<RequestIdempotencySubject>
{
    public override string Name => "request-idempotency";

    public override IReadOnlyDictionary<string, Func<RequestIdempotencySubject, Task>> Oracles { get; } =
        new Dictionary<string, Func<RequestIdempotencySubject, Task>>
        {
            ["idempotency-key-honored"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);

                // First create under key k1 — establishes the canonical resource id A.
                var first = await Create(http, s.CreatePath, "k1");
                var idA = await ReadId(first, "first create with key k1");

                // Repeat under the SAME key k1 — must replay the ORIGINAL, not re-create.
                var replay = await Create(http, s.CreatePath, "k1");
                var idReplay = await ReadId(replay, "repeat create with key k1");
                if (idReplay != idA)
                    throw new AvpFailException(
                        $"same idempotency key 'k1' created two distinct resources ('{idA}' then '{idReplay}') — " +
                        "the key must replay the original, never re-create.");

                // A DIFFERENT key k2 — must yield a DISTINCT resource.
                var other = await Create(http, s.CreatePath, "k2");
                var idB = await ReadId(other, "create with key k2");
                if (idB == idA)
                    throw new AvpFailException(
                        $"different idempotency keys 'k1' and 'k2' collapsed to one resource ('{idA}') — " +
                        "a distinct key must yield a distinct resource, not dedup regardless of the key.");
            },
        };

    private static Task<HttpResponseMessage> Create(HttpClient http, string path, string key)
    {
        var req = Http.Request(HttpMethod.Post, path, body: JsonContent.Create(new { name = "resource" }));
        req.Headers.Add("Idempotency-Key", key);
        return http.SendAsync(req);
    }

    private static async Task<string> ReadId(HttpResponseMessage res, string what)
    {
        Http.Accepted(res, what);
        var raw = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);
        if (!doc.RootElement.TryGetProperty("id", out var id))
            throw new AvpFailException($"{what}: response body has no 'id' field to identify the resource ({raw}).");
        var value = id.ValueKind == JsonValueKind.String ? id.GetString() : id.GetRawText();
        if (string.IsNullOrEmpty(value))
            throw new AvpFailException($"{what}: response 'id' was empty ({raw}).");
        return value;
    }
}
