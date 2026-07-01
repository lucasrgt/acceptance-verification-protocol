# AVP — the Acceptance Verification Protocol

> Deterministic behavior verification for AI-built features: a peripheral venous access to
> your system — tap the vein and confirm it's remediated.

**AVP** is the protocol: the language-neutral concepts (`subject`, `criterion`, `oracle`,
`condition`, `verdict`) plus a machine-readable **catalog of acceptance criteria**, each one
mined from a real defect that escaped a real test suite. This repo ships its two reference
implementations:

| Package | Substrate | Where |
|---|---|---|
| [`@aerofortress/assay`](assay/) (npm) | web — DOM (React/RTL/MSW), HTTP, design (jsdom style + real-browser geometry), LLM judge | [`assay/`](assay/) |
| [`Assay.Net`](assay.net/) (NuGet) | backend — HTTP / in-process (`WebApplicationFactory`) | [`assay.net/`](assay.net/) |

Both consume the same neutral contract — [`protocol/catalog.json`](protocol/catalog.json) +
[`protocol/design-catalog.json`](protocol/design-catalog.json) — generated from the shipped
archetypes and drift-guarded by the test suite. See [docs/PROTOCOL.md](docs/PROTOCOL.md) for
the contract, [CONTEXT.md](CONTEXT.md) for the vocabulary, and
[docs/adr/0001](docs/adr/0001-thin-layer-not-a-framework.md) for why everything stays thin.

## The problem

LLMs are great at trying until something works — but **only where a verifier exists**. Math
has a built-in judge; *"is this screen done?"* has none. Without a verifier, vibe coding
produces the classic **"looks done, isn't wired"**: the button renders but is a no-op, the
message disappears but the request failed, the list never refreshes. AVP **manufactures the
verifier**: it turns *"is the feature done?"* (subjective) into *"did the criteria pass?"*
(checkable). Determinism lives in the **verifier**, not the screen.

## What ships today

- **19 behaviour archetypes** (~50 criteria): action-effect, data-honesty, navigation,
  authorization, integration (webhooks/checkout), money, lifecycle gates, idempotency,
  temporal correctness, pagination, render resilience, credentials, and more.
- **20 design archetypes** (~20 criteria): design-token adherence, theme parity, WCAG
  contrast, accessible names, real-layout geometry (overflow, overlap, responsive, RTL,
  tap targets, layout shift, focus visibility, truncation), model-judged icon fit.
- Every criterion carries `seenIn` — the real fix commits it was mined from — and a
  **calibration bench**: the verifier must FAIL the pre-fix repro and PASS the post-fix one
  (current status: full detection, zero false alarms — see [docs/catalog.md](docs/catalog.md)
  and [docs/measurements.md](docs/measurements.md) when generated).

## Quickstart (JS/React)

```bash
npm i -D @aerofortress/assay vitest @testing-library/react @testing-library/user-event msw jsdom
```

```ts
// features/send-message/send.assay.ts — co-located with the feature it verifies
import { actionEffect } from '@aerofortress/assay';
import { defineVerification } from '@aerofortress/assay/react/vitest';
import { composer } from './send.subject'; // how to mount + which seams exist

defineVerification(actionEffect, composer);
```

```bash
npx assay verify        # runs every *.assay.* file through your Vitest
```

A **subject** declares the seams that already exist (how to mount, which endpoint, which
control); Assay drives the action, forces conditions (`success`, `api-error`, `offline`,
`double-activate`, …) and emits a per-criterion verdict + acceptance score — actionable red/
green for an agent loop, a report for a human. Backend criteria run over real HTTP via
`@aerofortress/assay/http`, design criteria via `/design` (jsdom) and `/design/browser`
(your installed Chrome — no browser download). See
[docs/getting-started.md](docs/getting-started.md) for all three adapters and
[assay/examples/todo-app](assay/examples/todo-app) for a full-stack example.

## Quickstart (.NET)

```bash
dotnet add package Assay.Net
```

```csharp
var verdict = await Runner.Run(
    Catalog.LoadDefault(), new RequestIdempotency(), "create-order",
    new RequestIdempotencySubject(BaseUrl: factoryUrl, CreatePath: "/orders"),
    transport: () => factory.CreateClient()); // or omit for a real socket
Console.WriteLine(Format.Verdict(verdict));
```

## Architecture (thin by decree)

- **L0 substrate** (not built here): Vitest, Testing Library, MSW, puppeteer-core over your
  installed Chrome, `HttpClient`/`WebApplicationFactory`, an LLM judge.
- **L1 core** (framework-neutral): the DSL, the oracle router, the aggregate verdict.
- **L2 adapters**: mount / force condition / observe, one per substrate.
- **L3 verdict**: pass/fail + evidence + score, stamped with archetype+protocol versions.

No config file, no runner, no plugin system (ADR 0001) — a library you import, ESM-only on
Node ≥ 20. Custom, off-catalog criteria are first-class via a per-call escape hatch
([ADR 0002](docs/adr/0002-custom-criteria-bring-your-own-off-catalog.md)) and never
contaminate the shipped catalog's benchmark.

## Science, not just a tool

Two measurable claims are baked in: the criteria set **converges** from failures (escape
accrual — every escape becomes a criterion), and archetypes **transfer** across projects
([docs/transfer.md](docs/transfer.md)). `node tools/measure/measure.mjs` (from `assay/`)
re-runs the calibration bench and appends the convergence table. Long-term goal: a
SWE-bench-style benchmark for web-feature acceptance.

## Development

```bash
cd assay && npm ci
npx tsc --noEmit && npm run lint && npx vitest run   # typecheck + lint + calibration bench
cd ../assay.net && dotnet test                        # the .NET suite
```

Releases: one `vX.Y.Z` tag publishes every package at that version (CI asserts it). See
[CONTRIBUTING.md](CONTRIBUTING.md) and [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE).
