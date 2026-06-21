using System.Net.Http.Json;

namespace Assay.Net.Archetypes;

/// <summary>Seam for the second-order-effects archetype: a trigger and the inboxes of every party it concerns.</summary>
public sealed record NotifySubject(string BaseUrl, string TriggerPath, IReadOnlyList<string> PartyInboxPaths);

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
                using var http = Http.Client(s.BaseUrl);
                var trigger = await http.SendAsync(Http.Request(
                    HttpMethod.Post, s.TriggerPath, body: JsonContent.Create(new { booking = "b1" })));
                Http.Accepted(trigger, "trigger the state transition");

                foreach (var inbox in s.PartyInboxPaths)
                {
                    var res = await http.GetAsync(inbox);
                    Http.Accepted(res, $"reading inbox {inbox}");
                    var messages = await res.Content.ReadFromJsonAsync<List<string>>() ?? [];
                    if (messages.Count == 0)
                        throw new AvpFailException(
                            $"party inbox '{inbox}' is empty — not every party was notified.");
                }
            },
        };
}
