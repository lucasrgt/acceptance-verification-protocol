# @aerofortress/assay

The reference **JS/React implementation of AVP** (the Acceptance Verification Protocol) — deterministic behavior
verification for AI-built web features. You declare what a feature must *do* (the archetype + criteria); Assay
runs it against a real substrate (rendered React, an HTTP backend, the laid-out DOM) and returns an actionable
**verdict** + acceptance score. The runtime sibling of the static doctor; standalone, like a test runner.

It runs **inside your existing Vitest suite** — `*.assay.*` files are plain tests. The `assay` bin is a thin
face over `vitest run` (it is a wrapper, not a runner of its own).

## Entry points

| Import | What it is | Needs |
|---|---|---|
| `@aerofortress/assay` | The authoring API: the DSL, archetypes, `runVerification`, `formatVerdict`, the `claudeJudge` factory. | — (the Anthropic SDK is lazy-loaded, optional) |
| `@aerofortress/assay/react` | The React substrate — render + probe + the MSW seam. | `react`, `react-dom`, `vitest`, a DOM env (`jsdom`) |
| `@aerofortress/assay/react/vitest` | The Vitest binding for the React adapter. | `vitest` |
| `@aerofortress/assay/http` | The HTTP substrate — verify against a real backend. | — |
| `@aerofortress/assay/design` | The design substrate — jsdom + computed style (tokens, spacing rhythm, declared states). | a DOM env (`jsdom`) |

`@testing-library/react`, `@testing-library/user-event` and `msw` ship as dependencies — Assay owns its substrate.
Your app's `react`/`react-dom`, the `vitest` host, `jsdom` and `@anthropic-ai/sdk` are peers (the last two
optional, needed only by the adapters/judge that use them). The design **geometry** tier (browser-measured
layout, via `puppeteer-core`) is not exported yet — it lands in a later minor once its public shape settles.

```bash
npm install -D @aerofortress/assay
```

```ts
// todo.assay.test.ts — a plain Vitest file
import { actionEffect } from "@aerofortress/assay";
import { verify } from "@aerofortress/assay/react";

verify(actionEffect({ /* the criteria the feature must satisfy */ }));
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
