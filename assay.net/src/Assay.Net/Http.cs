using System.Net.Http.Headers;

namespace Assay.Net;

/// <summary>
/// The HTTP adapter's assertion vocabulary — the <c>expect</c> an archetype's mechanical oracle uses
/// over the <c>http</c> substrate. Each helper throws <see cref="AvpFailException"/> on violation
/// (honest fail, never a silent pass). Thin: it rides <see cref="HttpClient"/>.
/// </summary>
public static class Http
{
    // The ambient transport for the current verification run. When a Runner.Run is handed a transport factory
    // it flows down this async context, so Client() hands an oracle that client instead of opening a socket —
    // letting a proof run over an in-memory test host (e.g. WebApplicationFactory) with no real port. Null
    // outside a transported run, so Client() falls back to a real HttpClient bound to the subject's base url.
    // AsyncLocal (not a plain static) so concurrent runs on separate async flows never see each other's transport.
    private static readonly AsyncLocal<Func<HttpClient>?> Ambient = new();

    /// <summary>
    /// The client an oracle drives the subject through: the ambient transport's client when a run supplied one
    /// (the subject's base url is then immaterial — the injected client carries its own address), otherwise a
    /// fresh <see cref="HttpClient"/> bound to <paramref name="baseUrl"/>. Always a fresh instance the caller
    /// owns and disposes, whether real or injected, so the per-oracle <c>using</c> stays correct.
    /// </summary>
    public static HttpClient Client(string baseUrl) =>
        Ambient.Value is { } transport ? transport() : new() { BaseAddress = new Uri(baseUrl) };

    /// <summary>
    /// Installs <paramref name="transport"/> as the ambient client factory for the current async flow until the
    /// returned token is disposed (restoring the previous transport, so runs can nest). A null factory clears it
    /// — the path real-port runs take. Internal: a run opts in through the <see cref="Runner.Run{T}"/> overload.
    /// </summary>
    internal static IDisposable UseTransport(Func<HttpClient>? transport)
    {
        var previous = Ambient.Value;
        Ambient.Value = transport;
        return new TransportScope(() => Ambient.Value = previous);
    }

    private sealed class TransportScope(Action restore) : IDisposable
    {
        public void Dispose() => restore();
    }

    /// <summary>Builds a request with an optional bearer token and body — the shape oracles send.</summary>
    public static HttpRequestMessage Request(HttpMethod method, string path, string? bearer = null, HttpContent? body = null)
    {
        var req = new HttpRequestMessage(method, path) { Content = body };
        if (bearer is not null)
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearer);
        return req;
    }

    /// <summary>The request was REFUSED at the authorization boundary (401/403/404).</summary>
    public static void Refused(HttpResponseMessage res, string what)
    {
        var code = (int)res.StatusCode;
        if (code is not (401 or 403 or 404))
            throw new AvpFailException(
                $"{what}: expected a refusal (401/403/404), got {code} — the server let it through.");
    }

    /// <summary>The request was ACCEPTED (2xx).</summary>
    public static void Accepted(HttpResponseMessage res, string what)
    {
        if (!res.IsSuccessStatusCode)
            throw new AvpFailException($"{what}: expected acceptance (2xx), got {(int)res.StatusCode}.");
    }

    /// <summary>The request was REJECTED with a client error (4xx).</summary>
    public static void Rejected(HttpResponseMessage res, string what)
    {
        var code = (int)res.StatusCode;
        if (code is < 400 or >= 500)
            throw new AvpFailException($"{what}: expected a 4xx rejection, got {code}.");
    }
}
