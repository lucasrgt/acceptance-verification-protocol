---
id: a81932ba-8886-4f6f-bb8b-e690302e43b5
slug: specs
type: reference
title: Assay Design — plan: acceptance verification for design fidelity
tags: 
provenance: observado
evidence: docs/design-acceptance.md (commit 96d56fa); design-escape mining: marketplace color/token=19 theme=6, project P component-consistency=9, cal.com transfer theme=84 responsive=88 spacing=82 overflow=78 icon=50
decay: stable
created: 2026-06-20T19:04:31.495163300+00:00
updated: 2026-06-20T19:04:31.495163300+00:00
validated: 2026-06-20T19:04:31.495163300+00:00
links: 
---

Plan to extend the AVP protocol to DESIGN fidelity as a SIBLING adapter (`assay/design`), NOT a separate protocol — reuses core/dsl + core/run + claudeJudge verbatim.

**Thesis:** the verifier for "is this design done?" is the DESIGN SYSTEM as ground truth (token set + component registry + composition rules). With that codified, most design fidelity is MECHANICAL, not taste.

**Mined catalog (10 archetypes, each grounded in a real fix):** token-adherence (#1 escape — semantic token vs raw palette/hardcoded hex), theme-parity (light/dark flips, no token without a dark pair), composition-canonical (one canonical DS component, not a bespoke fork; declared structure back·icon·title), type-hierarchy, color-hierarchy-contrast (WCAG via axe-core), icon-correctness (set + MODEL oracle for meaning-fit, e.g. toilet≠shower), state-coverage, spacing-rhythm, layer-integrity (z-index/overlay), layout-integrity (overflow/responsive).

**Substrate split — "determinism is layered" applied to design (answers "DOM simulator?"):**
- STATIC = host doctor, ALREADY EXISTS (Lazuli LZFE012 design-tokens, LZFE010 state-completeness) — not Assay's to re-own.
- jsdom (RTL + getComputedStyle): colors/fonts/contrast/composition-structure/theme-matrix/state-matrix. The codified-system residual lives here → highest ROI, build FIRST.
- Playwright (real browser, the `proof` plugin already wires it): GEOMETRY ONLY — spacing ratios, overflow, overlap, z-index, touch targets, responsive, screenshot theme-diff. jsdom has no layout engine (offsetWidth=0); no shortcut.

**Key transfer finding:** design escape classes transfer hard to non-Lazuli cal.com; the distribution shifts with codification — codified systems leave token/theme/composition (jsdom), uncodified ones are dominated by geometry (browser).

**Build order:** spike token-adherence over jsdom (full skeleton in one iteration) → rest of jsdom tier → Playwright geometry tier → icon-fit/visual-balance via claudeJudge. Prerequisite: design system AS DATA (tokens + component manifest + composition rules) — codifying it is the highest-value first step and the verifier becomes the proof the system is respected.

Anonymization: marketplace/project P/project F per docs/transfer.md — never the private names in tracked files. [[ae56a252]]
