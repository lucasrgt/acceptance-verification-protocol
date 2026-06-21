---
id: f3f27727-20cf-4cbb-973a-7b645d718b2c
slug: catalog
type: project
title: image-alt executed over jsdom — images-have-text-alternative (dom substrate, 18 design criteria)
tags: 
provenance: observado
evidence: npx vitest run: 54 files / 224 tests green; npx tsc --noEmit clean; bench/image-alt.test.ts detection=1/1 mutation killed=4/4
decay: stable
created: 2026-06-21T05:45:04.462701800+00:00
updated: 2026-06-21T05:45:04.462701800+00:00
validated: 2026-06-21T05:45:04.462701800+00:00
links: 
---

Iteration 2 of the assay-cycle loop added the **image-alt** design archetype (criterion `images-have-text-alternative`): every informative image (`<img>` / `role="img"`) must expose a text alternative (alt / aria-label / aria-labelledby / title), while a deliberately-decorative image (`alt=""`, `aria-hidden`, `role="presentation"`/`"none"`) is NOT flagged. The decorative branch is the sharp distinction and the false-alarm guard — the violation is the ABSENCE of a decision (no alt attribute), not an intentional empty one.

The #2 most common real-world a11y violation (WebAIM Million: missing alt on the majority of pages). Same `dom` substrate as accessible-name (accessibility tree only — no computed style, no layout). Distinct from accessible-name: that names INTERACTIVE controls, this names non-interactive informative graphics.

Files: src/archetypes/image-alt.ts, src/adapter-design/image-alt.ts, bench/image-alt.test.ts, bench/dataset/images-page.tsx. Registered in src/protocol.ts DESIGN_ARCHETYPES + src/adapter-design/verify.ts REGISTRY; serialized into protocol/design-catalog.json. Detection 1/1, false-alarm 0, mutation 4/4 (logo no-alt, avatar no-alt, role=img no-name, empty aria-label). Grounded in cal.com fa20f19e, 55113f20 + documenso df9c603a.

Design catalog now 18 criteria — style(7) + dom(2: accessible-name, image-alt) + geometry(8) + model(1), 64/64 mutants killed. Full suite 224 green, tsc clean. The dom substrate (a11y tree) is now the cheapest design tier, growing: accessible-name + image-alt. Related: [[accessible-name-executed-over-jsdom-controls-hav]].
