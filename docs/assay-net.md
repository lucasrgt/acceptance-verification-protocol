# Assay.NET — the backend adapter

> **Status (2026-07-22):** `Assay.Net` 0.4.0, 14 backend archetype implementations,
> 23 bound criteria, and 70 green tests under `-warnaserror`.

Assay.NET is the .NET reference implementation of AVP for HTTP and in-process
backends. It consumes the neutral catalogs embedded in the package, drives a real
subject through `HttpClient` or a supplied `WebApplicationFactory` transport, and
returns the same portable verdict semantics as Assay JS.

It is deliberately a thin library, not a runner or framework. A consumer calls
`Runner.Run`, usually from xUnit, and owns app startup, fixtures, authentication, and
fault injection. AeroFortress may enforce that every declared subject has proof, but
Assay.NET has no dependency on AeroFortress.

## Fail-closed contract

- `Pass` and `Fail` are decided evidence.
- `NotApplicable` is a genuine domain mismatch between criterion and subject.
- `Unresolved` means required evidence or an oracle was unavailable.
- The aggregate is `Inconclusive` when nothing was decided or anything remains
  unresolved. `AcceptanceScore` is null for an empty run.
- `verdict.RequireAccepted()` rejects fail, unresolved, and empty evidence.

Unexpected oracle exceptions become `Fail` with diagnostic evidence; only caller
cancellation abandons a run without a verdict.

## Bound backend catalog

| Archetype | Bound criteria |
|---|---|
| `access-control` | `requires-authentication` |
| `authorization` | `own-resource-only`, `role-required`, `server-is-authoritative` |
| `credential-authority` | `rejects-invalid-credentials`, `issues-token-on-valid` |
| `failure-honesty` | `dependency-failure-is-admitted` |
| `integration-integrity` | `webhook-signature-verified`, `webhook-effects-state`, `callback-resolves-entity`, `redirect-urls-bound` |
| `lifecycle-gate` | `gate-enforced-server-side` |
| `money-integrity` | `split-invariant` |
| `mutation-atomicity` | `concurrent-conflict-surfaces`, `multi-write-is-atomic` |
| `pagination-integrity` | `pages-cover-the-set` |
| `request-idempotency` | `idempotency-key-honored` |
| `resource-uniqueness` | `rejects-duplicate` |
| `second-order-effects` | `notifies-all-parties` |
| `submission-gate` | `gate-enforced-on-submission`, `gate-enforced-on-body-target` |
| `token-rotation` | `rotates-on-refresh`, `replay-burns-family` |

Each bound criterion is exercised over real Kestrel good/bad repros. The catalog
sync tests also prove the .NET-led source, committed JSON, embedded resources, and JS
mirror remain in lockstep.

## Usage

```csharp
var verdict = await Runner.Run(
    Catalog.LoadDefault(),
    new RequestIdempotency(),
    "create-order",
    subject,
    transport: () => factory.CreateClient());

verdict.RequireAccepted();
```

`SpecManifest.UnsatisfiedObligationsFrom(verdicts)` verifies subject × criterion obligations. A
verdict for one subject cannot satisfy another merely because both use the same
criterion id.
