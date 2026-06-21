---
id: 98bcdfc6-dab6-4dfc-ba0b-e0611564232a
slug: catalog
type: project
title: Frontier assessment (iter 3): a11y/design tier thinning — autocomplete is the last medium-value candidate
tags: 
provenance: observado
evidence: npx vitest run: 228 tests green (truncation landed); cal.com mine: autocomplete #24422/#21065/#6705/#2645, no heading-order grounding
decay: stable
created: 2026-06-21T05:49:35.170106400+00:00
updated: 2026-06-21T05:49:35.170106400+00:00
validated: 2026-06-21T05:49:35.170106400+00:00
links: 
---

After this loop cycle added accessible-name, image-alt, focus-visible-integrity and truncation-integrity, the design/a11y tier covers the high-frequency axe/WCAG rules: contrast, image-alt, accessible-name (interactive), focus-visible, reading-order, rtl, tap-target, layout-shift, truncation, + the 7 style criteria + icon (model). Full suite green at **228 tests** (truncation landed).

REMAINING FRONTIER (mined cal.com iter 3):
- **autocomplete (WCAG 1.3.5 Identify Input Purpose)** — the last MEDIUM-value grounded candidate. cal.com adds autocomplete repeatedly: #24422 (name/phone/location), #21065 (login/signup), #6705 (password), #2645. Criterion idea: an input whose purpose is inferable (email/name/tel/current-password/…) carries the matching `autocomplete` token. dom substrate. CAVEAT: the purpose→token inference is heuristic → false-alarm risk; scope tightly to unambiguous fields (type=email, type=password+name~=password, autocomplete-eligible names) to keep false-alarm 0. NOT YET IMPLEMENTED — queued for a serialized iteration.
- **heading-order / one-h1**: NO grounding in cal.com fix history — skip unless a fresh domain surfaces it.
- **table-header semantics**: only weak UI/padding hits — not a faithful a11y escape here.
- The rest (duplicate-id, aria-* validity, html-lang, document-title) are STATIC (host-doctor territory), not runtime Assay.

CONCLUSION: the FE/design high-value frontier is 1 candidate (autocomplete) from dry. After autocomplete, expect the stop condition (no high-value uncovered criterion with an available adapter) to be MET — remaining bulk of value is backend depth (Assay.NET, .NET-blocked per loop).

OPERATIONAL HAZARD (persists): two loop iterations ran concurrently on this repo again (the peer wrote truncation-integrity while iter 2/3 ran). Commits collided — git add -A swallowed the peer's orphan files. MUST serialize the loop (one iteration at a time); use scoped git add, never -A, while concurrent. Related: [[image-alt-executed-over-jsdom-images-have-text-a]] [[accessible-name-executed-over-jsdom-controls-hav]].
