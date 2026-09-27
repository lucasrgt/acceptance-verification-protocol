using System.Net.Http.Json;
using System.Text.Json;

namespace Assay.Net.Archetypes;

/// <summary>Seam for the second-order-effects archetype: a trigger and the inboxes of every party it concerns.</summary>
public sealed record NotifySubject(string BaseUrl, string TriggerPath, IReadOnlyList<string> PartyInboxPaths)
{
    /// <summary>Optional bearer credential for the transition.</summary>
    public string? TriggerToken { get; init; }
    /// <summary>Transition payload; null sends no body. The default preserves the original booking fixture.</summary>
    public object? TriggerBody { get; init; } = new { booking = "b1" };
    /// <summary>Optional bearer credentials in the same order as PartyInboxPaths.</summary>
    public IReadOnlyList<string?>? PartyInboxTokens { get; init; }
    /// <summary>Top-level response field containing the inbox array; null means the response is the array.</summary>
    public string? InboxItemsField { get; init; }
}

/// <summary>second-order-effects — a state transition notifies EVERY party it concerns, not one or none.</summary>
public sealed class SecondOrderEffects : Archetype<NotifySubject>
{
    /// <inheritdoc/>
    public override string Name => "second-order-effects";

    /// <inheritdoc/>
    public override IReadOnlyDictionary<string, Func<NotifySubject, Task>> Oracles { get; } =
        new Dictionary<string, Func<NotifySubject, Task>>
        {
            ["notifies-all-parties"] = async s =>
            {
                if (s.PartyInboxPaths.Count == 0 ||
                    (s.PartyInboxTokens is { } tokens && tokens.Count != s.PartyInboxPaths.Count))
                    throw new AvpFailException("Provide at least one party inbox and matching credentials when configured.");
                using var http = Http.Client(s.BaseUrl);
                async Task<int> Count(int party)
                {
                    using var request = Http.Request(HttpMethod.Get, s.PartyInboxPaths[party], s.PartyInboxTokens?[party]);
                    using var response = await http.SendAsync(request);
                    Http.Accepted(response, $"reading inbox {s.PartyInboxPaths[party]}");
                    var body = await response.Content.ReadFromJsonAsync<JsonElement>();
                    return (s.InboxItemsField is { } field ? body.GetProperty(field) : body).GetArrayLength();
                }
                var before = new int[s.PartyInboxPaths.Count];
                for (var party = 0; party < before.Length; party++) before[party] = await Count(party);
                using var triggerRequest = Http.Request(HttpMethod.Post, s.TriggerPath, s.TriggerToken,
                    s.TriggerBody is null ? null : JsonContent.Create(s.TriggerBody));
                using var trigger = await http.SendAsync(triggerRequest);
                Http.Accepted(trigger, "trigger the state transition");
                for (var party = 0; party < before.Length; party++)
                {
                    if (await Count(party) <= before[party])
                        throw new AvpFailException(
                            $"party inbox '{s.PartyInboxPaths[party]}' did not grow — not every party was notified.");
                }
            },
        };
}
