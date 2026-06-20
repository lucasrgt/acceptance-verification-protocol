---
id: 42005b73-156d-438f-a4a8-1b215365d5ed
slug: design
type: project
title: Design catalog · composition-canonical executed (atoms/molecules/organisms: slots present, ordered, canonical)
tags: 
provenance: observado
evidence: commit e890b35 (77020c9..e890b35); bench/composition-canonical.test.ts detection 1/1 + mutation 4/4; full suite 165 tests green, tsc 0
decay: stable
created: 2026-06-20T20:26:27.450844800+00:00
updated: 2026-06-20T20:26:27.450844800+00:00
validated: 2026-06-20T20:26:27.450844800+00:00
links: 
---

**Design-cycle iteration 3 — 4th design criterion.** `composition-canonical · canonical-composition`: a screen's landmark slots are the canonical DS components, present and in declared order (back · icon · title). The user's exact atoms/molecules/organisms + "voltar acima do título com ícone certo" example.

**Pivoted from color-contrast** — the contrast/a11y escapes in the private repos are TOOLING adoption (jsx-a11y, react-native-a11y eslint), not specific contrast-failure fixes → under-grounded as a standalone runtime criterion (it's largely static-doctor territory). composition-canonical was far better grounded: project P has 9 real "consolidate hand-rolled X into one <Component>" escapes. Gold rule respected — picked the grounded one.

**Verifier (jsdom):** the DS components emit `data-slot="<name>"` + `data-ds="<Component>"`; the probe reads `[data-slot]` in DOM order and checks (1) every declared slot present, (2) DOM order == declared order, (3) each slot's data-ds == expected component (a bespoke fork has no data-ds → caught). Subject gains a `composition` seam ([{slot, component}]). Mutation 4/4: wrong-order (back below title), missing-icon, bespoke-back (no marker), missing-back. GOOD green.

seenIn 897c6aa0 (one <TabBar>), 2c9376e7 (one <ConfirmDialog>), c596531b (ícone no page header).

**Design catalog: 4 criteria (token-adherence, theme-parity, type-hierarchy, composition-canonical), 17/17 mutants killed, false-alarm 0.** All jsdom, all through core/run.ts. Remaining jsdom: color-contrast (compute WCAG ratio directly — universal even if private grounding is thin/static; cal.com had contrast=5), state-coverage (hover/disabled/loading/empty matrix; grounded in "disabled dimming via inline style" + LZFE010). Then Playwright geometry tier (spacing-rhythm, layer-integrity, layout-integrity). [[f4899d42]]
