---
id: 38cf53fa-0d1f-4e27-8c60-65d0d73f8f65
slug: catalog
type: project
title: money-integrity · amount-rendered-exact executed (display half; 2nd cross-substrate archetype) + firefly-iii corpus
tags: 
provenance: observado
evidence: commit e280600 (fbfc4ed..e280600); bench/money-display.test.ts detection 1/1 + mutation 4/4; HTTP split-invariant still 5/5; full suite 35 files/145 tests green, tsc 0; firefly-iii mine money-integrity:89 (dominant)
decay: stable
created: 2026-06-20T18:33:37.453027400+00:00
updated: 2026-06-20T18:33:37.453027400+00:00
validated: 2026-06-20T18:33:37.453027400+00:00
links: 
---

**Iteration 6 — fresh domain (fintech) + new stack.** Cloned firefly-iii (Laravel/PHP personal finance) into dev/_acervo as the 8th corpus repo. Its distribution is **money-dominated: money-integrity=89** (vs navigation 43, validation 21) — the inverse of backend-heavy repos; money invariants ARE the product. This grounded the missing DISPLAY half of money-integrity.

`amount-rendered-exact` (FE): a money amount must be shown at the currency's exact precision — no float artifact, no dropped/extra decimals, no wrong rounding. money-integrity previously ran ONLY over HTTP (split-invariant at rest) + 2 STATIC; no executed display criterion.

**2nd cross-substrate archetype (after lifecycle-gate):** added the FE criterion to the SAME archetype, seam-gated by reach — split-invariant got `requires:'split'` (HTTP runs it, React skips it); amount-rendered-exact `requires:'amount-display'` (React runs it, HTTP skips it). Touched: money-integrity.ts (+criterion +MoneyExpect.amountRenderedExact), adapter-http/money.ts (+applies skip +stub), NEW adapter-react/money-integrity.ts (probe+hooks), verify.ts REGISTRY (+money-integrity → React). One archetype, two layers — money correct at rest AND in the view.

**Deterministic verifier:** probe formats canonical from INTEGER minor units (no float) and compares to the rendered amount token. Value 1050 minor = "10.50". Mutation 4/4: no-fixed (String(minor/100)="10.5"), drops-cents (floor="10"), over-precision (toFixed(4)="10.5000"), wrong-round (Math.round="11"). All ≠ "10.50", all die; GOOD green. seenIn firefly:797064a1/d55cc03e/ebc7ea0e.

**Executed detection 37/37 → 38/38, false-alarm 0, 13 archetypes.** Step-3 harvest now: temporal ×2, single-flight, pagination, render-resilience, money-display = 6 criteria / 3 new archetypes + 1 cross-substrate extension. The FE/HTTP frontier of clearly-grounded NEUTRAL classes is now largely exhausted across 4 mined domains (marketplace, scheduling, e-sign, finance). [[9b29bff0]]
