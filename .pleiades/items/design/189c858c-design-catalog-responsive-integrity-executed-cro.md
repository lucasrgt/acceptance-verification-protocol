---
id: 189c858c-cade-40eb-b384-77afc6f541e7
slug: design
type: fact
title: Design catalog · responsive-integrity executed (cross-viewport sweep)
tags: assay-design, design-catalog, responsive, browser-tier, puppeteer, protocol-gap
provenance: observado
evidence: src/archetypes/responsive-integrity.ts, src/adapter-design/responsive-integrity.ts, bench/responsive-integrity.test.ts; full suite 46 files/189 tests green; grounding hashes verified in dev/_acervo/{mastodon,gitea} git log
decay: seasonal
created: 2026-06-20T20:59:43.729683600+00:00
updated: 2026-06-20T20:59:43.729683600+00:00
validated: 2026-06-20T20:59:43.729683600+00:00
links: 
---

10th design criterion, 3rd browser/geometry one — and the cross-viewport one.

**responsive-integrity · holds-across-breakpoints**: the SAME surface is swept across
viewport widths (default 360/768/1280, overridable via `subject.breakpoints`) and must
never push the page past the viewport — `documentElement.scrollWidth ≤ width` at every
breakpoint. The escape is the classic "fits wide, breaks narrow" (horizontal scroll on
phone/tablet) that neither layout-integrity nor layer-integrity catches, because both are
single-width. Measured in real Chrome: set content once, then `setViewport` per breakpoint
so the layout reflows like a real resize, read scrollWidth via page.evaluate.

5 touches (established pattern): `src/archetypes/responsive-integrity.ts` (expect
`holdsAcrossBreakpoints()`), `src/adapter-design/responsive-integrity.ts` (probe), 1 line in
`browser-verify.ts` REGISTRY, `bench/dataset/responsive-row.tsx`, `bench/responsive-integrity.test.ts`.
Added one optional seam `breakpoints?: readonly number[]` to ReactDesignSubject.

Grounded faithfully in real responsive fixes from repos present in dev/_acervo (verifiable
now): Mastodon "advanced UI columns not using mobile styles" (mastodon:98ec6991), "vertical
videos overflowing the viewport" (mastodon:861625fd), Gitea "various overflows on actions
view" (gitea:b9f69b4a). NOTE: cal.com (cited by layout/layer-integrity) is NOT in the
current acervo — its hashes came from an earlier clone; future geometry criteria should
ground in repos actually present (mastodon/gitea are CSS-heavy and rich for responsive).

Results: detection 1/1, mutation 3/3 (fixed nowrap row / oversized 900px block / nowrap
heading), false-alarm 0, tsc clean, full suite 46 files / 189 tests green. Behaviour catalog
untouched (39/39).

**Design catalog now: 10 criteria — jsdom tier (7) + browser tier (3: layout, layer,
responsive), 37/37 mutants killed, false-alarm 0.**

STRUCTURAL GAP found this iteration (next high-value step, NOT new-criterion work):
`protocol/catalog.json` serialises ONLY the behaviour archetypes — `src/protocol.ts`
ARCHETYPES omits all 10 design archetypes. This is by current design (the protocol
vocabulary has no substrate/`requires` axis for jsdom/geometry; design `requires:'geometry'`
isn't in CONDITION_AXES), so the drift guard is green. Formalising a DESIGN protocol surface
(substrate axis in CONDITION_AXES + docs/PROTOCOL.md, design archetypes in the portable
catalog) is the structural task for when grounded criteria run dry — so Assay.NET / a Rails
adapter can implement the design tier against the contract. Logged in docs/design-acceptance.md step 5.

NEXT new-criterion candidate: icon-correctness via claudeJudge (model oracle — toilet≠shower
meaning-fit), the last non-mechanical design criterion. After that, grounded criteria are
largely harvested → approach stop (remaining value = the protocol-surface formalization above
+ Assay.NET, both scoped beyond "one new grounded criterion per iteration").
