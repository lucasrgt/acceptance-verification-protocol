using System.Net.Http.Headers;

namespace Assay.Net;

/// <summary>
/// The HTTP adapter's assertion vocabulary — the <c>expect</c> an archetype's mechanical oracle uses
/// over the <c>http</c> substrate. Each helper throws <see cref="AvpFailException"/> on violation
/// (honest fail, never a silent pass). Thin: it rides <see cref="HttpClient"/>, no bespoke transport.
/// </summary>
public static class Http
{
    /// <summary>An <see cref="HttpClient"/> bound to the subject's base url.</summary>
    public static HttpClient Client(string baseUrl) => new() { BaseAddress = new Uri(baseUrl) };

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
