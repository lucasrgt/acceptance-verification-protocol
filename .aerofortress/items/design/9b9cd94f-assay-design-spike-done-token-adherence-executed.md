---
id: 9b9cd94f-604d-4c6a-a15c-7542155af6ed
slug: design
type: project
title: Assay Design spike DONE — token-adherence executed over jsdom (protocol reuse proven)
tags: 
provenance: observado
evidence: commit fab4f6a (96d56fa..fab4f6a); bench/token-adherence.test.ts detection 1/1 + mutation 5/5; full suite 37 files/153 tests green, tsc 0; behaviour catalog untouched 39/39
decay: stable
created: 2026-06-20T19:21:51.728819300+00:00
updated: 2026-06-20T19:21:51.728819300+00:00
validated: 2026-06-20T19:21:51.728819300+00:00
links: 
---

First design-fidelity criterion EXECUTED caos→verde. Proves the AVP protocol extends to design with NO fork.

`token-adherence · uses-tokens-only`: a surface that renders any colour/space/radius/font off the design token scale fails; the same on tokens passes. Mutation 5/5 (raw palette colour #3b82f6 vs token #2563eb, off-scale bg/space/radius/font), false-alarm 0. Faithful escape dd834c98 ("badge tones go semantic — raw palette steps had no dark pair").

**Architecture proven (reuse, not fork):** new `src/adapter-design/` (subject + probe + verifyDesign dispatcher) runs through the SAME neutral `core/run.ts` as the React/HTTP adapters; new archetype `src/archetypes/token-adherence.ts` reuses `core/dsl` verbatim; ground truth = `src/design/tokens.ts` (the design system AS DATA — token scale + colour normaliser). Design archetypes are NOT in the behaviour `ARCHETYPES`/protocol.json (kept separate; behaviour drift-guard stays green at 39/39).

**jsdom finding (the "DOM simulator" answer, now empirical):** jsdom DOES resolve inline styles — colours normalised to rgb, px values as-is — so the token-membership check works WITHOUT a browser. The probe walks `document.body.querySelectorAll('*')`, reads `el.style.{color,backgroundColor,padding,borderRadius,fontSize}`, normalises, checks ∈ tokenScale. Limitation (honest): only INLINE styles are read; className/CSS-in-JS systems need the static doctor layer (LZFE012, already exists) or getComputedStyle-with-stylesheets; GEOMETRY (spacing ratios, overflow, z-index, responsive) has NO jsdom path → Playwright tier (next).

**Next (build order, docs/design-acceptance.md):** rest of jsdom tier — theme-parity, type-hierarchy, color-hierarchy-contrast (axe-core), state-coverage, composition-canonical structure — then the Playwright geometry tier (spacing-rhythm, layer-integrity, layout-integrity), then icon-fit/visual-balance via claudeJudge. [[a81932ba]]
