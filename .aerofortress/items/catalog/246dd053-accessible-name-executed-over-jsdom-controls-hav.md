---
id: 246dd053-e232-44d9-bdf7-08a000e3e478
slug: catalog
type: project
title: accessible-name executed over jsdom — controls-have-accessible-name (dom substrate, 17 design criteria)
tags: 
provenance: observado
evidence: npx vitest run: 53 files / 220 tests green; npx tsc --noEmit clean; bench/accessible-name.test.ts detection=1/1 mutation killed=4/4
decay: stable
created: 2026-06-21T05:39:56.818456700+00:00
updated: 2026-06-21T05:39:56.818456700+00:00
validated: 2026-06-21T05:39:56.818456700+00:00
links: 
---

Added the **accessible-name** design archetype (criterion `controls-have-accessible-name`): every interactive control reaching the accessibility tree must expose a non-empty accessible name (aria-labelledby / aria-label / associated <label> / name-from-content excluding aria-hidden / title; placeholder is NOT a name). The #1 real-world axe-core finding (icon-only buttons, unlabelled inputs).

**First design criterion on the `dom` substrate** — needs only the accessibility tree, no computed style (`style` tier) and no layout engine (`geometry` tier). A design/a11y criterion cheaper than the jsdom-style tier; extends the layered-determinism story.

Files: src/archetypes/accessible-name.ts, src/adapter-design/accessible-name.ts, bench/accessible-name.test.ts, bench/dataset/labeled-controls.tsx. Registered in src/protocol.ts DESIGN_ARCHETYPES + src/adapter-design/verify.ts REGISTRY; serialized into protocol/design-catalog.json. Detection 1/1, false-alarm 0, mutation 4/4 (bare icon button, placeholder-only input, icon-only link, text in aria-hidden span). Grounded in cal.com aria-label cluster (8cace7f7, a0e4580f, bf9be591, 02a86f1d).

CONCURRENCY: ran alongside a second agent that added **focus-visible-integrity** (geometry, WCAG 2.4.7). Both green. Design catalog now 17 criteria, 60/60 mutants. Two concurrent loop iterations on one repo is a real hazard — protocol.ts/design-catalog.json are shared files; hit "modified since read" mid-edit.
