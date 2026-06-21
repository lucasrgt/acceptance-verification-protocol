---
id: 46f58d29-a9fd-45bb-97fc-cd45f8e7a051
slug: design
type: project
title: Design catalog · truncation-integrity executed (geometry; affordance-aware text overflow)
tags: 
provenance: observado
evidence: tsc exit 0; new bench detection 1/1 false-alarm 0, mutation 4/4 killed, 3 affordances (ellipsis/clamp/scroll) pass clean; full suite 228/228 (55 files). Files: src/archetypes/truncation-integrity.ts, src/adapter-design/truncation-integrity.ts, bench/dataset/truncation-text.tsx, bench/truncation-integrity.test.ts; registered browser-verify.ts + protocol.ts; design-catalog.json regenerated; docs/design-acceptance.md updated.
decay: stable
created: 2026-06-21T05:50:17.979493800+00:00
updated: 2026-06-21T05:50:17.979493800+00:00
validated: 2026-06-21T05:50:17.979493800+00:00
links: 
---

**assay-cycle iteration 2 — new DESIGN criterion `truncation-integrity · overflowing-text-is-truncated`** (geometry tier, real Chrome). The text-overflow invariant: when text exceeds its width/height-constrained box it must be handled gracefully — ellipsis (`text-overflow`), `-webkit-line-clamp`, or scroll (`overflow:auto/scroll`). Two escapes: text SPILLS (`overflow:visible`) over neighbours, or is HARD-CLIPPED (`overflow:hidden`) with no ellipsis/clamp so the cut is invisible.

**Distinct from `layout-integrity · content-fits`** (the key design call): content-fits faults ANY hidden-overflow clip unconditionally — it is blind to the affordance and would even fault legitimate ellipsis truncation. truncation-integrity is AFFORDANCE-AWARE: clipping is correct precisely when an ellipsis/clamp/scroll signals it; the escape is the MISSING affordance. Probe walks leaf text holders whose scrollWidth/Height exceeds clientWidth/Height and checks computed overflow + textOverflow + webkitLineClamp.

**Faithfully grounded (gold rule — diffs read):** cal.com `f63d70552` (max-width span spilling → `overflow-hidden text-ellipsis whitespace-nowrap`), `22201cbc7` (`overflow:hidden` hard-clip → `line-clamp-3`), `3af6fee05` (tall content → `overflow-y-auto`). Mutation 4/4: spill-x, hard-clip-x, clip-y, spill-y; all three graceful affordances pass without false alarm.

**CONCURRENCY (recurring this loop):** a parallel assay-cycle iteration ran simultaneously and shipped `image-alt` (dom, images-have-text-alternative) in commit 8965cac — which accidentally swept my truncation SOURCE files (archetype+adapter) into its commit but not the registration/bench/doc. I completed the wiring on top and reconciled the shared totals (design catalog now 19 criteria: 7 style + 2 dom + 9 geometry + 1 model, 68/68 mutants). Detection across the design catalog now 19/19 false-alarm 0. [[6b45e83c]]
