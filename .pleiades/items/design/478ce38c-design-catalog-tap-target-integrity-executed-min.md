---
id: 478ce38c-87c9-4e99-a1de-67d2aee18c3f
slug: design
type: fact
title: Design catalog · tap-target-integrity executed (min hit-area)
tags: assay-design, design-catalog, tap-target, accessibility, wcag, browser-tier, stop-frontier
provenance: observado
evidence: src/archetypes/tap-target-integrity.ts, src/adapter-design/tap-target-integrity.ts, bench/tap-target-integrity.test.ts; full suite 50 files/207 tests green; CLS hashes mastodon:511e10df/gitea:32fdfb0b/documenso:1a23744d verified in dev/_acervo
decay: seasonal
created: 2026-06-20T21:17:26.404099300+00:00
updated: 2026-06-20T21:19:21.051526800+00:00
validated: 2026-06-20T21:19:21.051526800+00:00
links: 
---

14th design criterion, 6th browser/geometry one — the hit-area criterion.

**tap-target-integrity · targets-meet-minimum-size**: every interactive control
(`button, a[href], [role=button], input:not([type=hidden]), [data-target]`) must render at
least 44×44 CSS px on both axes (WCAG 2.5.5). The escape: a bare icon button, a thin text
link, a control shrunk to its glyph. Distinct from the other geometry criteria — it's the
control's OWN dimensions against a threshold.

Measured in real Chrome: getBoundingClientRect of every interactive element; fail any with
w or h < 44 - 0.5 tol. `MIN_TAP_TARGET_PX = 44` exported from the archetype. Dataset uses
`box-sizing: border-box` so declared sizes are exact (UA button padding/border doesn't add
noise — a real concern: default content-box buttons render larger than their width).

Grounded faithfully in the recurrent "clickable area" cluster (verifiable in dev/_acervo):
mastodon:2b93a221, mastodon:a8330be9, gitea:8703b6c9, gitea:06eaf74e.

Results: detection 1/1, mutation 3/3 (tiny-icon / thin-link / narrow-btn), false-alarm 0,
full suite 50 files / 207 tests green.

**Design catalog now: 14 criteria — jsdom (7) + geometry (6: layout/layer/responsive/
reading-order/rtl/tap-target) + model (1: icon), 49/49 mutants killed, false-alarm 0.**

STOP ASSESSMENT — CORRECTED (an earlier draft of this item wrongly declared the frontier dry;
a final broad sweep found one more strong class): **layout-shift / reserved-space (CLS)** is
grounded and RECURRENT across three repos — mastodon:511e10df ("Who to follow" widget shift),
gitea:32fdfb0b + gitea:99d7ef50 (file-tree / overflow-menu shift), documenso:1a23744d (table
shift on tab change). It's a DISTINCT temporal property (content position BEFORE vs AFTER an
async load/state change) no current criterion checks, buildable on the existing browser
adapter by reusing the `renderState` seam (states loading→loaded) and comparing a downstream
anchor's position. So the new-criterion frontier is NOT yet dry → next iteration builds
**layout-shift-integrity** before re-evaluating stop.
