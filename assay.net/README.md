# Assay.Net

> **The .NET reference implementation of AVP — the Acceptance Verification Protocol.**
> The runtime sibling of the static doctor: it manufactures the verifier an LLM lacks, turning
> *"is this feature done?"* into *"did the criteria pass?"*. Standalone, like xUnit.

**AVP** is the protocol — the language-neutral concepts (`subject`, `criterion`, `oracle`,
`condition`, `verdict`). **Assay.Net** is this package: AVP for .NET backends, a thin layer over the
neutral catalog that runs catalog-driven acceptance **archetypes** over a real subject (an HTTP
backend) and emits an actionable `Verdict` + `AcceptanceScore`.

It is **standalone**: it knows nothing of any framework. `AeroFortress.Framework` depends on AVP,
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
```

Mark a verification method as the proof of a catalog criterion with
`[AVP(typeof(Subject), "id")]` — the `[Fact]` of AVP, and the AVP half of the cross-layer bridge.
The subject is mandatory for coverage: sharing a criterion never lets one feature borrow another's proof.

```csharp
[AVP(typeof(CreateSplit), "split-invariant")]
[Fact]
public async Task split_is_exact_to_the_cent() { /* PASS good ∧ FAIL the escape */ }
```

## The catalog

`Catalog.LoadDefault()` reads the neutral `catalog.json` embedded in this package (the behaviour
catalog). To verify against a specific or newer catalog, `Catalog.Load(path)` reads any
`protocol/catalog.json` from disk. The catalog is the shared source of truth both the JS
(`@aerofortress/assay`) and .NET implementations conform to — this adapter reads it, it never owns it.

## License

MIT.
