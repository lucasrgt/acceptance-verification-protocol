---
id: b0461651-4f6c-4c3e-bd55-d23c5019e230
slug: specs
type: doc
title: Transfer evidence RQ4 (docs/transfer.md) + 4 archetypes implemented
tags: transfer, rq4, archetypes, neutral-core, cross-project, criterion-2, criterion-4
provenance: observado
evidence: docs/transfer.md; bench/ green 24/24; commits 0de68d9, b4c073d, 9c79fe2, da02ced
decay: seasonal
created: 2026-06-20T04:42:58.938732900+00:00
updated: 2026-06-20T04:42:58.938732900+00:00
validated: 2026-06-20T04:42:58.938732900+00:00
links: 
---

Overnight build state (criteria 2 + 4 substantially delivered).

NEUTRAL CORE (commit da02ced): orchestration extracted to `src/core/run.ts` (runVerification + VerifyHooks); Probe generalized over a per-archetype expect vocabulary; Condition vocab widened with the data-partition axis (empty/partial). `verify()` is now a registry in `src/adapter-react/verify.ts` dispatching by archetype name — adding an archetype = one hooks entry.

4 ARCHETYPES EXECUTED (detection 9/9, false-alarm 0, suite 24/24, typecheck clean):
- action-effect (3/3) — fires-primary-effect, no-phantom-success, error-is-specific(model), projections-converge.
- data-honesty (2/2) — no-fixture-fallback, no-fabricated-media. 2ND archetype, proves neutrality (render vs API, no action). repros 8ec5dae5/dfb23261.
- persona-scoped-visibility (2/2 CROSS-PROJECT) — no-cross-persona-affordance. THE transfer hero: same criterion catches marketplace persona leak (16c6cd43) AND SaaS Free-tier-sees-Pro leak (project F). render-as-actor probe.
- navigation-integrity (2/2 CROSS-PROJECT) — target-resolves. #1 by frequency. marketplace wrong-target (287ab352) + project P orphaned-route (7ba900d). navigate-spy probe.

TRANSFER (RQ4, docs/transfer.md): 4 independent Lazuli products (marketplace RN + project P React + project F React + the kit). Same archetypes recur independently; session-storm near-identical across 2 codebases; persona→tier generalization observed in real history. New sub-patterns harvested: flash-of-id (data-honesty), tier-scoped-visibility (persona), parent-without-Outlet (navigation). project P / project F = React19 + TanStack Router + Vitest/RTL → Assay React adapter applies directly.

NEXT: action-effect tail (request-accepted/idempotent-retry/survives-token-refresh); router-mounted probe for back-has-fallback/parent-without-Outlet + flash-of-id paint-timing; criterion 3 dogfood (examples + lazuli-net doctor rule + real apps).
