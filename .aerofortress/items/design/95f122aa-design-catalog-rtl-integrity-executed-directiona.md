---
id: 95f122aa-b22b-41cf-b80a-1b24ae989f81
slug: design
type: fact
title: Design catalog · rtl-integrity executed (directional-icon mirroring)
tags: assay-design, design-catalog, rtl, i18n, browser-tier, react-style-escaping, stop-frontier
provenance: observado
evidence: src/archetypes/rtl-integrity.ts, src/adapter-design/rtl-integrity.ts, bench/rtl-integrity.test.ts; full suite 49 files/203 tests green; mastodon:51345e51 verified in dev/_acervo/mastodon
decay: seasonal
created: 2026-06-20T21:13:47.681760+00:00
updated: 2026-06-20T21:13:47.681760+00:00
validated: 2026-06-20T21:13:47.681760+00:00
links: 
---

13th design criterion, 5th browser/geometry one — the RTL criterion.

**rtl-integrity · directional-icons-mirror**: a direction-dependent icon (back/next chevron,
marked `data-dir-icon`) must be horizontally mirrored under `dir=rtl` (computed transform has
negative horizontal scale) and NOT mirrored under `dir=ltr`. The escape: a directional glyph
left unflipped under RTL (a back arrow still pointing left when it should point right), or
flipped unconditionally (wrong under LTR). Distinct from icon-correctness (the glyph's MEANING
fits its label, direction-agnostic) — here the glyph is right, its ORIENTATION under RTL is
wrong. Only a real layout engine resolves the `[dir=rtl]` cascade + computed transform →
geometry tier.

Measured in real Chrome: render once, then for dir in [ltr, rtl] set documentElement.dir and
read each `[data-dir-icon]`'s getComputedStyle().transform; horizontalScale() parses the
matrix first coefficient (none→1, negative→mirrored). Fail if any directional icon isn't
mirrored under rtl, or is mirrored under ltr.

Grounded faithfully in mastodon:51345e51 "back arrow pointing to the incorrect direction in
RTL languages", with the RTL-layout cluster as context (mastodon:af157939d sidebar,
mastodon:5e4cc1a39 carousel).

GOTCHA fixed mid-iteration: React escapes `"` to `&quot;` inside `<style>` text content, so a
quoted `[dir="rtl"]` selector in a rendered <style> breaks (rule never matches). Use UNQUOTED
attribute selectors `[dir=rtl]` (valid CSS for simple identifiers). Caught by a false-alarm on
GOOD; debugged with a throwaway tsx script reading the computed transforms. Worth remembering
for any future criterion that injects CSS via a rendered <style>.

Results: detection 1/1, mutation 3/3 (no-flip / partial-flip / flip-always), false-alarm 0,
tsc clean, full suite 49 files / 203 tests green. Behaviour catalog untouched (39/39).

**Design catalog now: 13 criteria — jsdom (7) + geometry (5: layout/layer/responsive/
reading-order/rtl) + model (1: icon), 46/46 mutants killed, false-alarm 0.**

STOP FRONTIER — now genuinely approaching dry. RTL was the last strong grounded candidate
flagged. A fresh mining round over dev/_acervo (mastodon/gitea/documenso/monica) for remaining
classes (focus-trap, truncation/ellipsis-intent, z-index/stacking) turns up either
specializations of existing criteria (truncation ⊂ layout-integrity; stacking ⊂ layer-integrity)
or classes better served by the STATIC tier (host doctor / axe — focus-visible). No high-value,
NON-covered design criterion with an existing adapter remains. NEXT iteration should do one
honest confirming mining pass; if it confirms dry, the remaining value is structural (design
protocol surface: substrate axis + design archetypes in a portable catalog — design-acceptance.md
step 5) + Assay.NET, both beyond the loop's "one new grounded criterion" mandate → STOP.
