---
id: f4899d42-84b5-45fd-97df-b5779a4d9507
slug: design
type: project
title: Design catalog · type-hierarchy executed (heading size vs semantic level)
tags: 
provenance: observado
evidence: commit 77020c9 (462e812..77020c9); bench/type-hierarchy.test.ts detection 1/1 + mutation 4/4; full suite 161 tests green, tsc 0
decay: stable
created: 2026-06-20T20:21:45.627801700+00:00
updated: 2026-06-20T20:21:45.627801700+00:00
validated: 2026-06-20T20:21:45.627801700+00:00
links: 
---

**Design-cycle iteration 2 — 3rd design criterion.** `type-hierarchy · hierarchy-holds`: visual type size must match the semantic heading level — h1 > h2 > h3 strictly, and same level → same size. DISTINCT from token-adherence (which checks each font-size is ON the scale) — this is the ORDERING/consistency dimension.

**Verifier (jsdom):** probe reads all h1-h6 with their inline font-size, compares every pair: (a) level(a)<level(b) but size(a)<=size(b) → inversion; (b) same level, different size → inconsistent. Mutation 4/4: inverted (h1 smaller than sections), equal-weight (title==section), subtitle-beats-title (h3>h1), inconsistent-h2 (two h2 at 20/24px). GOOD monotonic → green.

seenIn 25b16a79 ("one type scale"), 9b609f8c ("the real type scale"), 7a2dfc74 ("drop redundant per-step headings").

**Design catalog: 3 criteria (token-adherence, theme-parity, type-hierarchy), 13/13 mutants killed, false-alarm 0.** Adapter pattern holding clean: each new design archetype = 1 archetype file + 1 probe + 1 REGISTRY line in adapter-design/verify.ts, all through core/run.ts. NEXT jsdom-tier: color-hierarchy-contrast (axe-core — WCAG), state-coverage (render hover/disabled/loading/empty matrix), composition-canonical structure (uses DS component, slots ordered). Then Playwright geometry tier. [[0dcd29ae]]
