---
id: 9b29bff0-e8b0-4bca-a5a9-ae45da620647
slug: catalog
type: project
title: render-resilience archetype — survives-malformed-data executed (no white-screen on bad data)
tags: 
provenance: observado
evidence: commit fbfc4ed (0fdd9f9..fbfc4ed); bench/render-resilience.test.ts detection 1/1 + mutation 4/4; full suite 34 files/141 tests green, tsc 0; cal.com=44 "crash" fixes mined
decay: stable
created: 2026-06-20T18:24:48.766574700+00:00
updated: 2026-06-20T18:24:48.766574700+00:00
validated: 2026-06-20T18:24:48.766574700+00:00
links: 
---

**Iteration 5 — new archetype `render-resilience`** (13th archetype). First rejected two under-grounded candidates (gold rule): `clock-not-frozen` (the "time ago"/"tick" hits in the local acervo are CSS/icons, 0 real frozen-clock fixes) and `optimistic-rollback-on-error` (the `optimistic` hits are ADD-feature commits, not missing-rollback fixes). Did NOT mold either.

Picked the strongest-grounded remaining neutral class: **cal.com=44 "crash" fixes**. Criterion `survives-malformed-data`: a surface fed the data it can actually receive (null user, missing array, non-string field, absent nested object) must degrade, not white-screen. AVP's thesis in its purest form — the unit test ran on the happy fixture; only rendering real edge data finds the crash.

**Distinct from state-completeness** (STATIC: does it DECLARE an empty branch) — a component WITH an empty state still crashes on a null NESTED field. This is RUNTIME resilience.

**Verifier (new probe shape):** mount the surface inside try/catch — a crash on a null/empty/malformed field throws synchronously out of render(); fail if it throws, then assert a graceful `fallbackMarker` is shown. No MSW. Mutation 4/4: null-user (reads .name on null), undef-items (.map on undefined), nonstring-title (.trim on a number), missing-meta (.tags on undefined) — all crash, all die; guarded GOOD degrades to "No profile data".

seenIn calcom:000324c0 ("a.trim is not a function"), calcom:013e6143 ("handle empty location"), documenso:43fe5584 ("crash removing last dropdown option"). Files: `src/archetypes/render-resilience.ts`, `src/adapter-react/render-resilience.ts`, `bench/dataset/profile-card.tsx`, `bench/render-resilience.test.ts`.

**Executed detection 36/36 → 37/37, false-alarm 0, now 13 archetypes.** Step-3 harvest: temporal ×2, single-flight, pagination, render-resilience = 5 criteria / 3 new archetypes. FE frontier now genuinely thin — clearly-grounded neutral classes are largely exhausted in the local acervo; next high-value bulk is BACKEND (Assay.NET, the user's step 4). [[d218d0ae]]
