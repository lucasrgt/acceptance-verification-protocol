# Assay.Net

> **The .NET reference implementation of AVP — the Acceptance Verification Protocol.**
> The runtime sibling of the static doctor: it manufactures the verifier an LLM lacks, turning
> *"is this feature done?"* into *"did the criteria pass?"*. Standalone, like xUnit.

**AVP** is the protocol — the language-neutral concepts (`subject`, `criterion`, `oracle`,
`condition`, `verdict`). **Assay.Net** is this package: AVP for .NET backends, a thin layer over the
neutral catalog that runs catalog-driven acceptance **archetypes** over a real subject (an HTTP
backend) and emits an actionable `Verdict` with an `Outcome` plus a nullable
`AcceptanceScore`. Empty or unresolved proof is `Inconclusive`, never green.

It is **standalone**: it knows nothing of any framework. `Skies.Framework` depends on AVP,
never the reverse — the static doctor recognizes the `[AVP(typeof(Subject), "id")]` attribute by name to
enforce that every declared production subject has its own matching proof.

## Install

```
dotnet add package Assay.Net
```

## Use

```csharp
using Assay.Net;
using Assay.Net.Archetypes;

// The neutral catalog ships inside the package — no path needed.
var catalog = Catalog.LoadDefault();

var subject = new MoneyIntegritySubject(baseUrl, "/split", platformBps: 1500);
var verdict = await Runner.Run(catalog, new MoneyIntegrity(), "booking-split", subject);

// A criterion's proof is calibrated: it must PASS the correct backend AND FAIL the vulnerable one.
foreach (var r in verdict.Results)
    Console.WriteLine($"{r.CriterionId}: {r.Status} — {r.Reason}");
Console.WriteLine($"acceptanceScore = {verdict.AcceptanceScore}");
verdict.RequireAccepted(); // fail closed on fail, unresolved, or empty evidence
```

Mark a verification method as the proof of a catalog criterion with
`[AVP(typeof(Subject), "id")]` — the `[Fact]` of AVP, and the AVP half of the cross-layer bridge.
The subject is mandatory for coverage: sharing a criterion never lets one feature borrow another's proof.

```csharp
[AVP(typeof(CreateSplit), "split-invariant")]
[Fact]
public async Task split_is_exact_to_the_cent() { /* PASS good ∧ FAIL the escape */ }
```

## Authorization request shapes

Ownership probes default to PUT with the original name payloads; role probes default to bodyless GET.
For commands that identify the resource in JSON, set the method and the two bodies on the subject:

```csharp
var subject = new AuthorizationSubject(baseUrl, ownerToken,
    "/sessions/revoke", "/sessions/revoke", "/admin/disable", adminToken, memberToken)
{
    ResourceMethod = HttpMethod.Post,
    OwnBody = new { sessionId = ownedSessionId },
    OthersBody = new { sessionId = anotherUsersSessionId },
    PrivilegedMethod = HttpMethod.Post,
    PrivilegedBody = new { sessionId = targetSessionId },
};
```

The verifier sends those requests directly: the owned operation must succeed, the other owner's operation
must be refused, and the privileged operation must distinguish its two bearer identities. Set a body to
`null` for a bodyless operation such as DELETE. Existing constructor calls and their default behavior remain
unchanged. These are transport choices for the existing criteria, not new criteria or alternative oracles.

## Notification effects

`SecondOrderEffects` snapshots every inbox before posting the transition and requires each inbox to grow.
Old messages alone never prove delivery. Existing `NotifySubject` constructor calls still work with array
responses and the default booking payload. For authenticated APIs with wrapped inbox responses:

```csharp
var subject = new NotifySubject(baseUrl, "/bookings/123/cancel", ["/host/inbox", "/guest/inbox"])
{
    TriggerToken = actorToken,
    TriggerBody = new { reason = "Changed plans" },
    PartyInboxTokens = [hostToken, guestToken],
    InboxItemsField = "notifications",
};
var verdict = await Runner.Run(catalog, new SecondOrderEffects(), "booking-cancellation", subject);
verdict.RequireAccepted();
```

Set `TriggerBody` to `null` for a bodyless POST. Each supplied inbox token corresponds to the path at the
same index. Empty inbox lists, mismatched credential lists, refused requests, and malformed arrays fail.
Use isolated inboxes with synchronous delivery and enough capacity to expose count growth: this probe
does not correlate message IDs, poll eventual delivery, or distinguish unrelated concurrent messages.
An inbox whose page stays full fails rather than assuming a new notification was delivered.

## The catalog

`Catalog.LoadDefault()` reads the neutral `catalog.json` embedded in this package (the behaviour
catalog). To verify against a specific or newer catalog, `Catalog.Load(path)` reads any
`protocol/catalog.json` from disk. The catalog is the shared source of truth both the JS
(`avp-assay`) and .NET implementations conform to — this adapter reads it, it never owns it.

## License

MIT.
