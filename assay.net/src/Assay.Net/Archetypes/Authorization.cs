using System.Net.Http.Json;

namespace Assay.Net.Archetypes;

/// <summary>Seam for the authorization archetype: tokens are bearer identities the repro server maps to owners/roles.</summary>
public sealed record AuthorizationSubject(
    string BaseUrl,
    string OwnerToken,
    string OwnResource,
    string OthersResource,
    string AdminPath,
    string AdminToken,
    string LesserToken);

/// <summary>authorization — the caller may only touch what it owns, at the role its operation implies.</summary>
public sealed class Authorization : Archetype<AuthorizationSubject>
{
    public override string Name => "authorization";

    public override IReadOnlyDictionary<string, Func<AuthorizationSubject, Task>> Oracles { get; } =
        new Dictionary<string, Func<AuthorizationSubject, Task>>
        {
            ["own-resource-only"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);
                var own = await http.SendAsync(Http.Request(
                    HttpMethod.Put, s.OwnResource, s.OwnerToken, JsonContent.Create(new { name = "ok" })));
                Http.Accepted(own, "owner writing its own resource");

                var cross = await http.SendAsync(Http.Request(
                    HttpMethod.Put, s.OthersResource, s.OwnerToken, JsonContent.Create(new { name = "pwned" })));
                Http.Refused(cross, "caller writing another account's resource id (IDOR)");
            },

            ["role-required"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);
                var asAdmin = await http.SendAsync(Http.Request(HttpMethod.Get, s.AdminPath, s.AdminToken));
                Http.Accepted(asAdmin, "admin calling a privileged endpoint");

                var asLesser = await http.SendAsync(Http.Request(HttpMethod.Get, s.AdminPath, s.LesserToken));
                Http.Refused(asLesser, "a lesser role calling a privileged endpoint");
            },
        };
}
