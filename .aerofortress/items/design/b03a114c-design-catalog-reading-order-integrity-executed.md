---
id: b03a114c-02d9-4cab-ac56-bd83bd8a2431
slug: design
type: fact
title: Design catalog · reading-order-integrity executed (a11y, geometry tier)
tags: assay-design, design-catalog, reading-order, accessibility, browser-tier, stop-frontier
provenance: observado
evidence: src/archetypes/reading-order-integrity.ts, src/adapter-design/reading-order-integrity.ts, bench/reading-order-integrity.test.ts; full suite 48 files/199 tests green; mastodon:d20d0492 verified in dev/_acervo/mastodon
decay: seasonal
created: 2026-06-20T21:09:15.567188900+00:00
updated: 2026-06-20T21:09:15.567188900+00:00
validated: 2026-06-20T21:09:15.567188900+00:00
links: 
---

12th design criterion, 4th browser/geometry one — an accessibility criterion.

**reading-order-integrity · dom-order-matches-visual**: the DOM/focus order of landmark
items (`[data-order]`) must match their VISUAL reading order (top→bottom, then left→right
within a row). The escape is CSS that reorders elements visually — flex `order`,
`column-reverse`, float, absolute positioning — without moving them in the DOM, so a sighted
user and a keyboard/screen-reader user encounter content in DIFFERENT orders. Distinct from
composition-canonical (DOM order vs a DECLARED slot spec): here there's no declared order —
the measured VISUAL geometry is the ground truth and the DOM must agree.

Measured in real Chrome: read each `[data-order]` element's getBoundingClientRect (top/left)
in DOM order, compute visual order by grouping into rows within an 8px band then sorting by
(row, left), and fail on the first DOM-vs-visual divergence. `src/adapter-design/reading-order-integrity.ts`
+ `src/archetypes/reading-order-integrity.ts`, registered in browser-verify.ts.

Grounded faithfully in ONE exact hash: mastodon:d20d0492 "Accessibility: Ensure focus order
of post elements matches visual reading order" (post header author/handle/time reordered with
CSS so focus order diverged from reading order). Did NOT pad seenIn with the unrelated
data-reorder commits the grep surfaced — gold rule is faithful-over-count.

Results: detection 1/1, mutation 3/3 (flex-order / column-reverse / absolute-bump),
false-alarm 0, tsc clean, full suite 48 files / 199 tests green. Behaviour catalog untouched.

**Design catalog now: 12 criteria — jsdom (7) + geometry (4: layout/layer/responsive/
reading-order) + model (1: icon), 43/43 mutants killed, false-alarm 0.**

STOP FRONTIER (re-mined this iteration): one more grounded, adapter-available, non-covered
candidate remains — **RTL/direction integrity** (mastodon:51345e51 "back arrow pointing the
wrong way in RTL", af157939d sidebar on RTL, 5e4cc1a39 carousel on RTL): render under
dir=rtl and assert (a) no NEW overflow/overlap vs LTR and (b) directional icons mirror.
Geometry tier, adapter exists. That's the next candidate. After RTL, a mining round finds no
further high-value non-covered design criterion with an existing adapter → the new-criterion
frontier goes dry and the remaining value is structural (design protocol surface) + Assay.NET.
