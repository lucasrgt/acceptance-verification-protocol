---
id: c3aa220d-676b-49b7-8903-2fc641bfaf3f
slug: catalog
type: project
title: Loop assay-cycle (2026-06-21) — FE/design frontier DRY; stop condition met (iter 3)
tags: 
provenance: observado
evidence: Independent mining iter 3: documenso+firefly FE/a11y/responsive/focus/contrast clusters all map to covered archetypes; cal.com last candidate (input-purpose/autocomplete) being implemented by peer iteration (src/archetypes/input-purpose.ts, registered verify.ts, in protocol.ts DESIGN_ARCHETYPES). No uncovered high-value FE/HTTP candidate remains. Suite green pre-stop (228 + peer's input-purpose).
decay: stable
created: 2026-06-21T05:54:42.434789200+00:00
updated: 2026-06-21T05:54:42.434789200+00:00
validated: 2026-06-21T05:54:42.434789200+00:00
links: 
---

**STOP DECISION — loop assay-cycle, this run (design-cycle continuation).** After 3 iterations the iter-3 mining+selection sweep finds NO high-value uncovered criterion with an available FE/HTTP adapter.

**Harvest this run (3 iterations, all caos→verde + mutation, pushed to public origin/main):**
1. focus-visible-integrity · focus-is-visible (geometry, WCAG 2.4.7 keyboard focus ring; calcom:7393ba1d1) — iter 1
2. truncation-integrity · overflowing-text-is-truncated (geometry, affordance-aware text overflow; calcom:f63d70552/22201cbc7/3af6fee05) — iter 2
3. (peer, concurrent) accessible-name (dom), image-alt (dom), input-purpose/autocomplete (dom, WCAG 1.3.5, in flight)

**Design catalog now ~20 criteria:** style 7 (token-adherence, theme-parity, type-hierarchy, composition-canonical, state-coverage, color-contrast, spacing-rhythm) + dom 3 (accessible-name, image-alt, input-purpose) + geometry 9 (layout, layer, responsive, reading-order, rtl, tap-target, layout-shift, focus-visible, truncation) + model 1 (icon-correctness). Behaviour catalog 14 archetypes fully executed FE/HTTP (prior run).

**Why STOP (gold rule, not scraping):** independent iter-3 mining of documenso + firefly-iii shows every high-frequency FE/design cluster (a11y, responsive/overflow, focus, contrast/theme) maps to an already-executed archetype. The remaining candidates are: input-purpose (taken/covered by peer), STATIC host-doctor territory (heading-order, duplicate-id, html-lang, document-title), or UNGROUNDED in the corpora (color-only-signal/1.4.1, prefers-reduced-motion, heading-order — no faithful repro → did NOT mould). None clears the bar.

**What's left OUT, deliberately:** the remaining bulk of value is BACKEND depth — Assay.NET (the ~40% backend escapes), reachable only by a .NET adapter, which this loop explicitly excludes ("NÃO selecione critério que só roda em .NET"). The catalog never proves itself complete; it grows the moment a fresh domain or clean repro surfaces a new class.

**OPERATIONAL NOTE:** this run had concurrent iterations colliding on shared files (protocol.ts, design-catalog.json, docs) every iteration — handled with scoped `git add` (never -A) + reconciliation. The loop SHOULD be serialized one iteration at a time. [[6b45e83c]]
