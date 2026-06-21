---
id: 38c085cc-eb59-4011-938e-fd54d34a6204
slug: design
type: project
title: Design catalog · layer-integrity executed (region overlap, browser tier — 9 criteria total)
tags: 
provenance: observado
evidence: commit 70717bb (6eff797..70717bb); bench/layer-integrity.test.ts detection 1/1 + mutation 3/3; full suite 45 files/185 tests green, tsc 0
decay: stable
created: 2026-06-20T20:52:44.013245100+00:00
updated: 2026-06-20T20:52:44.013245100+00:00
validated: 2026-06-20T20:52:44.013245100+00:00
links: 
---

**Design-cycle iteration 8 — 9th design criterion (2nd browser/geometry).** `layer-integrity · no-unintended-overlap`: two in-flow regions that should stack must not visually overlap. DISTINCT from layout-integrity (an element clipping its OWN content) — this is two SEPARATE elements colliding.

**Verifier (browser):** probe renders to static markup → Chrome → page.evaluate reads [data-region] getBoundingClientRect → pairwise box intersection (overlap >2px both axes). Registered in browser-verify.ts REGISTRY (now layout-integrity + layer-integrity). Mutation 3/3: absolute-position, negative-margin, transform translateY — each collides a button region over a textarea region. GOOD stacks → green. seenIn calcom:44ccc72f (Continue overlaps Bio textarea), 794046cf, 0e900a73.

**Design catalog: 9 criteria — jsdom tier (7) + browser tier (2: layout-integrity, layer-integrity). 34/34 mutants killed, false-alarm 0.** Behaviour catalog untouched (39/39).

**NEXT:** responsive-across-breakpoints (render the SAME surface at narrow + wide viewports, assert no NEW clip/overlap appears at a breakpoint — cal.com responsive=88, the biggest geometry class; reuse the layout+layer measurements across two viewport widths). Then icon-correctness via claudeJudge (model oracle — the toilet≠shower meaning-fit, the last non-mechanical criterion). After that the catalog's grounded criteria are largely harvested → approach stop. [[41ee575a]]
