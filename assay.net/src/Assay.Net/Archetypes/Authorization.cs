using System.Net.Http.Json;

namespace Assay.Net.Archetypes;

/// <summary>
/// Seam for the authorization archetype: tokens are bearer identities the repro server maps to owners/roles.
/// The trailing fields describe a write whose privileged field the client must not be trusted to set:
/// a write to <paramref name="WritePath"/> sends a tampered price; <paramref name="ReadPath"/> reads back
/// what the server actually stored, which must be the server-resolved truth (100), never the client's word.
/// </summary>
public sealed record AuthorizationSubject(
    string BaseUrl,
    string OwnerToken,
    string OwnResource,
    string OthersResource,
    string AdminPath,
    string AdminToken,
    string LesserToken,
    string WritePath = "",
    string ReadPath = "",
    string Token = "")
{
    /// <summary>Method used for both ownership probes; defaults to the original PUT contract.</summary>
    public HttpMethod ResourceMethod { get; init; } = HttpMethod.Put;
    /// <summary>Body for the owned resource; null sends no content.</summary>
    public object? OwnBody { get; init; } = new { name = "ok" };
    /// <summary>Body identifying the other owner's resource; null sends no content.</summary>
    public object? OthersBody { get; init; } = new { name = "pwned" };
    /// <summary>Method used for both privileged-role probes; defaults to GET.</summary>
    public HttpMethod PrivilegedMethod { get; init; } = HttpMethod.Get;
    /// <summary>The same operation body is sent with the privileged and lesser-role tokens.</summary>
    public object? PrivilegedBody { get; init; }
}

/// <summary>authorization — the caller may only touch what it owns, at the role its operation implies.</summary>
public sealed class Authorization : Archetype<AuthorizationSubject>
{
    /// <inheritdoc/>
    public override string Name => "authorization";

    /// <inheritdoc/>
    public override IReadOnlyDictionary<string, Func<AuthorizationSubject, Task>> Oracles { get; } =
        new Dictionary<string, Func<AuthorizationSubject, Task>>
        {
            ["own-resource-only"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);
                var own = await http.SendAsync(Http.Request(
                    s.ResourceMethod, s.OwnResource, s.OwnerToken, s.OwnBody is null ? null : JsonContent.Create(s.OwnBody)));
                Http.Accepted(own, "owner writing its own resource");

                var cross = await http.SendAsync(Http.Request(
                    s.ResourceMethod, s.OthersResource, s.OwnerToken, s.OthersBody is null ? null : JsonContent.Create(s.OthersBody)));
                Http.Refused(cross, "caller writing another account's resource id (IDOR)");
            },

            ["role-required"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);
                var asAdmin = await http.SendAsync(Http.Request(
                    s.PrivilegedMethod, s.AdminPath, s.AdminToken, s.PrivilegedBody is null ? null : JsonContent.Create(s.PrivilegedBody)));
                Http.Accepted(asAdmin, "admin calling a privileged endpoint");

                var asLesser = await http.SendAsync(Http.Request(
                    s.PrivilegedMethod, s.AdminPath, s.LesserToken, s.PrivilegedBody is null ? null : JsonContent.Create(s.PrivilegedBody)));
                Http.Refused(asLesser, "a lesser role calling a privileged endpoint");
            },

            ["server-is-authoritative"] = async s =>
            {
                if (string.IsNullOrEmpty(s.WritePath) || string.IsNullOrEmpty(s.ReadPath))
                    throw new AvpNotApplicableException("server-is-authoritative: this subject provides no write/read seam.");
                using var http = Http.Client(s.BaseUrl);

                // Write the item but tamper with a privileged field (price): claim it costs 1, not the
                // server's truth of 100. The server must resolve the price itself, never trust the client.
                const int tampered = 1;
                const int authoritative = 100;
                var write = await http.SendAsync(Http.Request(
                    HttpMethod.Post, s.WritePath, s.Token,
                    JsonContent.Create(new { item = "x", price = tampered })));
                Http.Accepted(write, "writing an item with a tampered price");

                // Read back what the server actually stored.
                var read = await http.SendAsync(Http.Request(HttpMethod.Get, s.ReadPath, s.Token));
                Http.Accepted(read, "reading the stored item back");
                var stored = await read.Content.ReadFromJsonAsync<StoredItem>();

                if (stored is null)
                    throw new AvpFailException(
                        "server-is-authoritative: could not read the stored item back to confirm the recorded price.");

                if (stored.Price == tampered)
                    throw new AvpFailException(
                        $"server-is-authoritative: the server recorded the client's tampered price ({tampered}) " +
                        $"instead of its own truth ({authoritative}) — the client set a privileged field.");
            },
        };

    /// <summary>The stored item read back from the server; only its server-resolved price matters here.</summary>
    private sealed record StoredItem(string Item, int Price);
}
