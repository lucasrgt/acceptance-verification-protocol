---
id: 0dcd29ae-9e34-4269-979e-b67fbeaad40f
slug: design
type: project
title: Design catalog · theme-parity executed (jsdom; per-theme token scales)
tags: 
provenance: observado
evidence: commit 462e812 (fab4f6a..462e812); bench/theme-parity.test.ts detection 1/1 + mutation 4/4; full suite 38 files/157 tests green, tsc 0; behaviour catalog untouched 39/39
decay: stable
created: 2026-06-20T20:17:45.619569800+00:00
updated: 2026-06-20T20:17:45.619569800+00:00
validated: 2026-06-20T20:17:45.619569800+00:00
links: 
---

**Design-cycle iteration 1 — 2nd design criterion.** `theme-parity · flips-with-theme`: across every theme, every colour the surface renders belongs to the ACTIVE theme's token scale. Canonical escape = a light value stranded in dark mode (light badge on dark surface; light text invisible in dark).

**Verifier (jsdom, no browser):** the probe renders the subject under each theme via a new `renderTheme(theme)` seam, and for each theme checks every inline colour (color/backgroundColor/borderColor) ∈ themeColorScale(theme). Ground truth extended: `themes.{light,dark}.color` + `themeColorScale()` in src/design/tokens.ts — the two scales are DISJOINT on purpose so a stuck value is unambiguous. Mutation 4/4: stuck-bg (light surface in dark), stuck-text (light text invisible in dark), hardcoded-light (all colours pinned), raw-step (#3b82f6 off both). GOOD resolves per theme → green.

seenIn dd834c98 ("raw palette steps had no dark pair"), 67ac3fcd ("theme toggle stuck on dark"), 6ac555ae ("flips every surface"). theme-parity is essentially token-adherence with a theme dimension.

**Design catalog status: 2 criteria executed (token-adherence, theme-parity), 9/9 mutants killed, false-alarm 0.** Behaviour catalog separate + untouched (39/39); design archetypes are NOT in the behaviour protocol.json. NEXT (jsdom tier, build order docs/design-acceptance.md): type-hierarchy, color-hierarchy-contrast (axe-core), state-coverage, composition-canonical structure → then Playwright geometry tier. [[9b9cd94f]] [[a81932ba]]
