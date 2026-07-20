# @aerofortress/assay

The reference **JS/React implementation of AVP** (the Acceptance Verification Protocol) — deterministic behavior
verification for AI-built web features. You declare what a feature must *do* (the archetype + criteria); Assay
runs it against a real substrate (rendered React, an HTTP backend, the laid-out DOM) and returns an actionable
**verdict** + acceptance score. The runtime sibling of the static doctor; standalone, like a test runner.

It runs **inside your existing Vitest suite** — the canonical `*.assay.test.*` suffix is both
Assay-filterable and Vitest-discoverable. The `assay` bin is a thin
face over `vitest run` (it is a wrapper, not a runner of its own).

## Entry points

| Import | What it is | Needs (peer) |
|---|---|---|
| `@aerofortress/assay` | The authoring API: the DSL, archetypes, `runVerification`, `composeVerdicts`, `formatVerdict`. | — |
| `@aerofortress/assay/react` | The React substrate — render + probe + the MSW seam. | `react`, `react-dom`, `@testing-library/react`, `@testing-library/user-event`, `msw`, `jsdom` |
| `@aerofortress/assay/react/vitest` | `defineVerification` — the Vitest binding for the React adapter. | `vitest` |
| `@aerofortress/assay/http` | The HTTP substrate — verify a real backend over the wire. | — |
| `@aerofortress/assay/design` | The design substrate — jsdom + computed style (tokens, themes, contrast, a11y). | `jsdom` |
| `@aerofortress/assay/design/browser` | The GEOMETRY tier — real layout in your installed Chrome/Edge (overflow, responsive, RTL, tap targets, layout shift…). | `puppeteer-core` |
| `@aerofortress/assay/judge` | `claudeJudge` — the reference `model`-oracle judge. | `@anthropic-ai/sdk` |

Every substrate library is an **optional peer** — install only what the adapters you use
need (the react line above for the DOM tier; nothing extra for `/http`). The package is
**ESM-only** and needs Node ≥ 20 — it rides an ESM-first substrate (Vitest, MSW 2) by design.

```bash
npm install -D @aerofortress/assay vitest
```

```ts
// features/todo/todo.assay.test.ts — co-located with the feature, run by `npx assay verify`
import { actionEffect } from "@aerofortress/assay";
import { defineVerification } from "@aerofortress/assay/react/vitest";
import { addTodoSubject } from "./todo.subject"; // the seams: how to mount, which endpoint, which control

defineVerification(actionEffect, addTodoSubject);
```

## Authoring your own criteria (off-catalog)

The shipped catalog covers **universal** invariants, each grounded in a real escape. For a
**domain rule specific to your product** — say, *"every bank integration must expose the same
account protocol"* — you author your own criterion with the same public DSL and run it through
the same engine. Custom criteria live in **your** repo and never enter the package's accuracy
benchmark (see [ADR 0002](../../docs/adr/0002-custom-criteria-bring-your-own-off-catalog.md)).

```ts
import { archetype, criterion, mechanical, runVerification, AvpFail } from "@aerofortress/assay";

// 1 — author the criterion (reads like any catalog archetype)
const accountProtocol = archetype("account-protocol-conformance", "0.1.0", () => {
  criterion(
    "exposes-canonical-account-protocol",
    "Every bank provider returns { id, currency, integer balanceMinor }.",
    { substrate: "http" },
    mechanical(async ({ act, expect }) => { await act(); expect.everyProviderIsCanonical(); }),
  );
});

// 2 — bind it to a substrate with your own probe, then run it
const verdict = await runVerification("all-banks", accountProtocol, { probe: () => myProbe(subject) });
```

Want it on the same Vitest host (gating + formatted verdict) as the catalog? Pass the hooks
per-call — no global registration:

```ts
verify(accountProtocol, subject, { hooks: (s) => ({ probe: () => myProbe(s) }) });          // React
verifyHttp(accountProtocol, subject, { hooks: (s) => ({ probe: () => myProbe(s) }) });        // HTTP
defineVerification(accountProtocol, subject, { hooks: (s) => ({ probe: () => myProbe(s) }) });// Vitest
```

A full worked example, calibrated caos→verde (the verifier passes a compliant fleet and catches a
bank that breaks the protocol), lives in [`test/custom-criterion.test.ts`](./test/custom-criterion.test.ts).

MIT © Lucas Tinoco
