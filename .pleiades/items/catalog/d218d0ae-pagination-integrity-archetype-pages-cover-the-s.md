---
id: d218d0ae-38fe-42ed-9707-74da4cc3ca28
slug: catalog
type: project
title: pagination-integrity archetype — pages-cover-the-set executed (multi-page union invariant)
tags: 
provenance: observado
evidence: commit 0fdd9f9 (e592d64..0fdd9f9); bench/pagination-integrity.test.ts detection 1/1 + mutation 4/4; full suite 33 files/137 tests green, tsc 0; cal.com=16 + documenso=10 pagination fixes mined
decay: stable
created: 2026-06-20T18:18:38.605497700+00:00
updated: 2026-06-20T18:18:38.605497700+00:00
validated: 2026-06-20T18:18:38.605497700+00:00
links: 
---

**Iteration 4 — new archetype `pagination-integrity`** (12th archetype). Criterion `pages-cover-the-set`: paging through a list yields every item exactly once — the UNION of pages equals the full set.

**Why a new archetype, not under data-honesty:** `count-matches-source` (data-honesty) checks ONE response's count. Pagination integrity is the MULTI-PAGE invariant — completeness + uniqueness across page traversal. Different mechanism, own archetype.

**Grounded by error analysis:** cal.com=16, documenso=10 pagination fixes. seenIn documenso:7d257236 ("default pagination on documents list API" — only first page returned), documenso:0488442 ("pagination discrepancy"), calcom:367e2666 ("apply standard pagination to /bookings").

**Deterministic FE verifier (new probe substrate):** in-memory paginated list (7 items, size 3 → 3 pages); the probe drives "next" to the end collecting `[data-testid=paged-item]` ids per page, then asserts the multiset == expectedIds (no missing / dup / extra). No MSW needed — the boundary-math bug is reproduced in the component's slice(). Mutation 4/4: off-by-one offset (drops a/d/g), overlapping windows (repeats d/g), page-param-ignored (first-page-only → a,b,c ×3, missing d-g), unstable-sort rotation (strands one, loses another). All die; GOOD green.

Files: `src/archetypes/pagination-integrity.ts`, `src/adapter-react/pagination-integrity.ts`, `bench/dataset/paged-list.tsx`, `bench/pagination-integrity.test.ts`. Registered in protocol.ts + index.ts + adapter-react/verify.ts REGISTRY.

**Executed detection 35/35 → 36/36, false-alarm 0, now 12 archetypes.** Harvest from step-3 new-domain mining so far: temporal-integrity (zoned-to-user, floating-date-not-shifted), action-effect·single-flight, pagination-integrity·pages-cover-the-set. FE frontier thinning — remaining strong candidates are getting marginal (temporal clock-not-frozen still needs a real diff). [[f7852ada]]
