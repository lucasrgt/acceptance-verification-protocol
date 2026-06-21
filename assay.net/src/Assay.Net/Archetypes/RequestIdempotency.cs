using System.Net.Http.Json;
using System.Text.Json;

namespace Assay.Net.Archetypes;

/// <summary>
/// Seam for the request-idempotency archetype: a mutation endpoint that honors an Idempotency-Key header.
/// <paramref name="RequestBody"/> is the payload to send (defaults to a generic create); <paramref name="IdField"/>
/// is the response field that identifies the effect — a resource id for a create, or the observable outcome
/// (e.g. the resulting balance) for an in-place mutation. The same key must replay that value; a different key
/// must apply again and yield a different one.
/// </summary>
public sealed record RequestIdempotencySubject(
    string BaseUrl,
    string CreatePath,
    object? RequestBody = null,
    string IdField = "id");

/// <summary>
/// request-idempotency — a mutation carrying an idempotency key is applied at most once: two requests with the
/// SAME key yield one effect (the original, replayed); a DIFFERENT key applies again and yields a distinct one.
/// </summary>
public sealed class RequestIdempotency : Archetype<RequestIdempotencySubject>
{
    /// <inheritdoc/>
    public override string Name => "request-idempotency";

    /// <inheritdoc/>
    public override IReadOnlyDictionary<string, Func<RequestIdempotencySubject, Task>> Oracles { get; } =
        new Dictionary<string, Func<RequestIdempotencySubject, Task>>
        {
            ["idempotency-key-honored"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);

                // First call under key k1 — establishes the canonical effect value A.
                var first = await Send(http, s, "k1");
                var idA = await ReadField(first, s.IdField, "first call with key k1");

                // Repeat under the SAME key k1 — must replay the ORIGINAL, not apply again.
                var replay = await Send(http, s, "k1");
                var idReplay = await ReadField(replay, s.IdField, "repeat call with key k1");
                if (idReplay != idA)
                    throw new AvpFailException(
                        $"same idempotency key 'k1' produced two distinct '{s.IdField}' values ('{idA}' then '{idReplay}') — " +
                        "the key must replay the original, never apply twice.");

                // A DIFFERENT key k2 — must apply again, yielding a DISTINCT value.
                var other = await Send(http, s, "k2");
                var idB = await ReadField(other, s.IdField, "call with key k2");
                if (idB == idA)
                    throw new AvpFailException(
                        $"different idempotency keys 'k1' and 'k2' collapsed to one '{s.IdField}' value ('{idA}') — " +
                        "a distinct key must apply again, not dedup regardless of the key.");
            },
        };

    private static Task<HttpResponseMessage> Send(HttpClient http, RequestIdempotencySubject s, string key)
    {
        var payload = s.RequestBody ?? new { name = "resource" };
        var req = Http.Request(HttpMethod.Post, s.CreatePath, body: JsonContent.Create(payload, payload.GetType()));
        req.Headers.Add("Idempotency-Key", key);
        return http.SendAsync(req);
    }

    private static async Task<string> ReadField(HttpResponseMessage res, string field, string what)
    {
        Http.Accepted(res, what);
        var raw = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);
        if (!doc.RootElement.TryGetProperty(field, out var value))
            throw new AvpFailException($"{what}: response body has no '{field}' field to identify the effect ({raw}).");
        var text = value.ValueKind == JsonValueKind.String ? value.GetString() : value.GetRawText();
        if (string.IsNullOrEmpty(text))
            throw new AvpFailException($"{what}: response '{field}' was empty ({raw}).");
        return text;
    }
}
