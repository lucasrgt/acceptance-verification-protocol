namespace Assay.Net.Archetypes;

/// <summary>
/// Seam for the access-control archetype: <paramref name="ProtectedPath"/> is an endpoint that requires
/// authentication, reached with <paramref name="Method"/> (GET by default). The oracle sends the request with
/// NO bearer; authorization runs before the handler, so no body is needed for the unauthenticated probe.
/// </summary>
/// <param name="BaseUrl">The server's base url (immaterial when a run supplies a transport).</param>
/// <param name="ProtectedPath">The protected endpoint that must refuse an unauthenticated caller.</param>
/// <param name="Method">The HTTP method the endpoint is reached with (default <c>GET</c>).</param>
public sealed record AccessControlSubject(
    string BaseUrl,
    string ProtectedPath,
    string Method = "GET");

/// <summary>
/// access-control — a protected endpoint is the gate to whatever it guards: an unauthenticated request is
/// refused (401/403), never silently served. This is the baseline acceptance property every <c>[Critical]</c>
/// authenticated slice must hold; richer rules (own-resource-only, role-required) layer on via the
/// <see cref="Authorization"/> archetype.
/// </summary>
public sealed class AccessControl : Archetype<AccessControlSubject>
{
    /// <inheritdoc/>
    public override string Name => "access-control";

    /// <inheritdoc/>
    public override IReadOnlyDictionary<string, Func<AccessControlSubject, Task>> Oracles { get; } =
        new Dictionary<string, Func<AccessControlSubject, Task>>
        {
            ["requires-authentication"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);
                var res = await http.SendAsync(Http.Request(new HttpMethod(s.Method), s.ProtectedPath));
                Http.Refused(res, $"unauthenticated {s.Method} {s.ProtectedPath}");
            },
        };
}
