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

MIT © Lucas Tinoco
