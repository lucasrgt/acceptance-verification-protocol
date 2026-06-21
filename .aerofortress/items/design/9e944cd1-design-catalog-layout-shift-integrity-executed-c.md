---
id: 9e944cd1-1cf4-46de-bd83-ba928626b585
slug: design
type: fact
title: Design catalog · layout-shift-integrity executed (CLS, temporal)
tags: assay-design, design-catalog, layout-shift, cls, core-web-vitals, browser-tier, stop-frontier
provenance: observado
evidence: src/archetypes/layout-shift-integrity.ts, src/adapter-design/layout-shift-integrity.ts, bench/layout-shift-integrity.test.ts; full suite 51 files/211 tests green; CLS hashes verified in dev/_acervo/{mastodon,gitea,documenso}
decay: seasonal
created: 2026-06-20T21:22:20.806703300+00:00
updated: 2026-06-20T21:22:20.806703300+00:00
validated: 2026-06-20T21:22:20.806703300+00:00
links: 
---

15th design criterion, 7th browser/geometry one — the TEMPORAL one (cumulative layout shift).

**layout-shift-integrity · reserved-space-stable**: async content (image, widget, banner)
must reserve its space so a downstream `[data-anchor]` keeps its position between the
`loading` and `loaded` states — no cumulative layout shift. The escape: an unsized image, a
late-mounting widget, or an expanding banner pushes everything below it the moment it appears.
Fix = reserve the box up front (explicit dimensions, aspect-ratio, fixed-height skeleton).

DISTINCT from every other geometry criterion (all measure a single static layout): this is
TEMPORAL — it compares the layout BEFORE vs AFTER load. Implemented by REUSING the existing
`renderState` seam (no new subject seam): the browser probe renders renderState('loading') and
renderState('loaded'), measures `[data-anchor]` getBoundingClientRect().top in each, fails if
|Δtop| > 1px. `src/adapter-design/layout-shift-integrity.ts` + archetype, registered in
browser-verify.ts.

Grounded faithfully in the recurrent layout-shift cluster (verifiable in dev/_acervo):
mastodon:511e10df ("Who to follow" widget shift), gitea:32fdfb0b (file-tree collapse shift),
documenso:1a23744d (table shift on tab change).

Results: detection 1/1, mutation 3/3 (unsized-image 0→180 / late-widget 0→120 /
expanding-banner 0→40), false-alarm 0, tsc clean, full suite 51 files / 211 tests green.
Behaviour catalog untouched (39/39).

**Design catalog now: 15 criteria — jsdom (7) + geometry (7: layout/layer/responsive/
reading-order/rtl/tap-target/layout-shift) + model (1: icon), 52/52 mutants killed,
false-alarm 0.** The `renderState` seam now serves TWO archetypes (state-coverage jsdom +
layout-shift geometry) — a sign the seam set is stabilising.

STOP ASSESSMENT — frontier dry again (this time checked the temporal axis too). The design
space is now covered across all four substrates AND both the static-layout and temporal axes:
token/theme/type/composition/state/contrast/spacing (jsdom), layout/layer/responsive/
reading-order/rtl/tap-target (geometry static) + layout-shift (geometry temporal), icon (model).
A mining round over dev/_acervo finds only: specializations of existing criteria
(truncation⊂layout, stacking⊂layer, RTL-overflow⊂responsive+rtl), STATIC/axe territory owned
by the host doctor (focus-visible, aria presence), or behaviour-catalog territory (loading/
empty/error ⊂ state-coverage + data-honesty + render-resilience). reduced-motion is weakly
grounded (one mastodon hit) and needs media emulation — low value. No high-value, NON-covered
design criterion with an existing FE/browser adapter remains. Remaining value is STRUCTURAL
(design protocol surface: substrate axis + design archetypes in a portable catalog —
design-acceptance.md step 5) + Assay.NET, both beyond the loop's "one new grounded criterion
per iteration" mandate → the design-cycle should STOP.
