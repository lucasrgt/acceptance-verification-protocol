using System.Net.Http.Json;

namespace Assay.Net.Archetypes;

/// <summary>
/// Seam for the money-integrity archetype: a split endpoint that, given a total in integer CENTS,
/// returns the platform/host shares in cents. <paramref name="PlatformFractionBps"/> is the policy
/// fraction in basis points (e.g. 1500 = 15%).
/// </summary>
public sealed record MoneyIntegritySubject(string BaseUrl, string SplitPath, int PlatformFractionBps);

/// <summary>The split server's response: the two shares of a total, in integer cents.</summary>
public sealed record SplitResponse(int Platform, int Host);

/// <summary>money-integrity — a money split sums to the whole exact to the cent, with no float-rounding leak.</summary>
public sealed class MoneyIntegrity : Archetype<MoneyIntegritySubject>
{
    // Awkward totals (in cents) that surface float-rounding leaks: odd cents and small amounts
    // where platform + host can drift from the total under naive Math.Round arithmetic.
    private static readonly int[] Totals = [1001, 333, 9999, 100, 1, 7, 4567, 12345];

    /// <inheritdoc/>
    public override string Name => "money-integrity";

    /// <inheritdoc/>
    public override IReadOnlyDictionary<string, Func<MoneyIntegritySubject, Task>> Oracles { get; } =
        new Dictionary<string, Func<MoneyIntegritySubject, Task>>
        {
            ["split-invariant"] = async s =>
            {
                using var http = Http.Client(s.BaseUrl);
                foreach (var total in Totals)
                {
                    var res = await http.GetAsync($"{s.SplitPath}?total={total}");
                    Http.Accepted(res, $"splitting total {total} cents");
                    var split = await res.Content.ReadFromJsonAsync<SplitResponse>()
                                ?? throw new AvpFailException(
                                    $"split of total {total} returned no body — cannot verify the invariant.");

                    if (split.Platform < 0 || split.Host < 0)
                        throw new AvpFailException(
                            $"split of total {total} has a negative share (platform={split.Platform}, host={split.Host}).");

                    if (split.Platform + split.Host != total)
                        throw new AvpFailException(
                            $"split of total {total} does not sum to the whole: platform={split.Platform} + host={split.Host} = {split.Platform + split.Host} != {total} (a cent leaked).");

                    var expectedPlatform = (int)((long)total * s.PlatformFractionBps / 10000);
                    if (split.Platform != expectedPlatform)
                        throw new AvpFailException(
                            $"split of total {total}: platform share {split.Platform} != policy amount {expectedPlatform} cents ({s.PlatformFractionBps} bps) — fraction is off by the cent.");
                }
            },
        };
}
