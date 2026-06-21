---
description: Implement ONE backend (http-substrate) AVP criterion as a .NET archetype in avp/assay.net — archetype oracle + a good/bad Kestrel repro pair + xUnit caos→verde tests. Use when closing a backend criterion from the catalog (e.g. server-is-authoritative, idempotency-key-honored, gate-enforced-server-side, split-invariant, pages-cover-the-set, callback-resolves-entity).
---

# Implement a backend AVP criterion in Assay.Net

Implements exactly ONE criterion. The criteria DEFINITIONS already live in the neutral
catalog (`avp/protocol/catalog.json`); you only bind a .NET oracle + calibrate the ruler.

## Rules (non-negotiable — from the AVP constitution)
- **Thin layer.** Ride the BCL: `HttpClient` to probe, Kestrel minimal API for repro servers,
  xUnit to run. No bespoke runner, no config file, no IR.
- **One file per archetype.** A NEW archetype → its own `assay.net/src/Assay.Net/Archetypes/<Name>.cs`.
  An EXISTING archetype → add the oracle to its existing file only. Never touch a sibling's file
  (collision-safe for parallel work).
- **Honest.** A criterion whose seam is unavailable is `Skipped`, never silently passed.
- English only. Scoped `git add` of just your files, never `-A`.

## Steps
1. Read the criterion in `avp/protocol/catalog.json`: its `archetype`, `id`, `statement`, `condition`.
2. **Archetype class** (`assay.net/src/Assay.Net/Archetypes/<Name>.cs`):
   - If the archetype exists, add `["<criterion-id>"] = async s => { ... }` to its `Oracles`.
   - If new: `public sealed record <Name>Subject(string BaseUrl, ...)` (the seam) + a
     `public sealed class <Name> : Archetype<<Name>Subject>` with `Name => "<archetype>"` and the
     oracle(s). The oracle drives `Http.Client/Request` and asserts via `Http.Refused/Accepted/Rejected`
     (add a vocabulary helper to `Http.cs` only if genuinely new — that file IS shared, so prefer not).
   - Throw `AvpFailException` (via the `Http.*` helpers) to fail; return normally to pass.
3. **Repro pair + tests** in a NEW file `assay.net/tests/Assay.Net.Tests/<Name>_<criterion>Tests.cs`:
   - Build a GOOD (correct) and a BAD (vulnerable) Kestrel server with `Repro.Start(app => { app.MapXxx(...); })`
     (helpers `Repro.Start/Bearer/Body/BaseUrl` are `internal`). Model the real escape the criterion guards.
   - Two `[Fact]`s: GOOD → `Runner.Run(TestCatalog.Load(), new <Name>(), "...", subject)` has the criterion
     `Pass`; BAD → same criterion `Fail`. The bad server MUST be failed, or the ruler is worthless.
4. Run `cd avp/assay.net && dotnet test`. Iterate until green. Do NOT weaken an assertion to pass a bad server.

## Reference
The shipped trio is the template: `Archetypes/Authorization.cs` (+ `AuthorizationTests`/`Repro.AuthGood/AuthBad`),
`IntegrationIntegrity.cs`, `SecondOrderEffects.cs`. Copy that shape.
