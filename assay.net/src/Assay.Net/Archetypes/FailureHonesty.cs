namespace Assay.Net.Archetypes;

/// <summary>A mutation driven while one of its required downstream dependencies is forced to fail.</summary>
/// <param name="BaseUrl">Server base URL; ignored when the runner supplies a transport.</param>
/// <param name="FaultingRequest">Returns a fresh request that reaches the forced dependency failure.</param>
/// <param name="AdmitsFailure">Optional policy for APIs whose declared error envelope uses a 2xx transport status.</param>
public sealed record FailureHonestySubject(
    string BaseUrl,
    Func<HttpRequestMessage> FaultingRequest,
    Func<HttpResponseMessage, Task<bool>>? AdmitsFailure = null);

/// <summary>Proves a required dependency failure cannot be swallowed into a phantom success.</summary>
public sealed class FailureHonesty : Archetype<FailureHonestySubject>
{
    /// <inheritdoc/>
    public override string Name => "failure-honesty";

    /// <inheritdoc/>
    public override IReadOnlyDictionary<string, Func<FailureHonestySubject, Task>> Oracles { get; } =
        new Dictionary<string, Func<FailureHonestySubject, Task>>
        {
            ["dependency-failure-is-admitted"] = async subject =>
            {
                using var http = Http.Client(subject.BaseUrl);
                var response = await http.SendAsync(subject.FaultingRequest());
                var admitted = subject.AdmitsFailure is null
                    ? !response.IsSuccessStatusCode
                    : await subject.AdmitsFailure(response);
                if (!admitted)
                    throw new AvpFailException(
                        $"a required dependency failed but the operation returned {(int)response.StatusCode} " +
                        "without its declared error envelope — phantom success.");
            },
        };
}
