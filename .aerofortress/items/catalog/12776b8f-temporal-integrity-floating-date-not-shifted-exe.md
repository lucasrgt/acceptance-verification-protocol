---
id: 12776b8f-3998-4b4e-a782-0bc595897834
slug: catalog
type: project
title: temporal-integrity · floating-date-not-shifted executed (the anti-zoned-to-user invariant)
tags: 
provenance: observado
evidence: commit 10cc279 (24d0479..10cc279); bench/floating-date.test.ts detection 1/1 + mutation 4/4; full suite 31 files/129 tests green, tsc 0; faithful repro from cal.com 26e85823 (dayjs.tz(dateStr,tz)→dayjs.utc(dateStr))
decay: stable
created: 2026-06-20T18:05:02.557696800+00:00
updated: 2026-06-20T18:05:02.557696800+00:00
validated: 2026-06-20T18:05:02.557696800+00:00
links: 
---

**Iteration 2 — second temporal criterion executed.** `floating-date-not-shifted`: a date-only value (expiry date, birthday — no time, no zone) must display AS AUTHORED; passing it through `new Date()`/`dayjs.tz()` strands it in a zone and drops it a day.

**The conceptual point (why two criteria, not one):** `zoned-to-user` and `floating-date-not-shifted` are SHARP OPPOSITES — an instant must TAKE the viewer's zone; a floating date must take NO zone. Conflating them is the #1 source of date confusion in JS. Both run under one archetype, seam-gated: the instant subject (instantIso+timeZone) skips floating-date; the date-only subject (dateOnly) skips zoned-to-user.

**Faithful + deterministic:** grounded in cal.com 26e85823 — the fix literally replaces `dayjs.tz(dateStr, tz)` (which converts an already-UTC date string into the target zone, shifting it) with `dayjs.utc(dateStr)`. `2025-01-01` localized to any zone behind UTC drops to 2024-12-31 — pinned to explicit western zones / offset subtraction so it's deterministic on any CI host (never the host's TZ). Mutation 4/4: dayjs-tz-style Intl, toLocaleDateString-with-zone, Pacific/Honolulu, manual offset-sub — all drop the date a day, all die; GOOD (authored parts, no Date round-trip) green.

Files: `bench/dataset/floating-date.tsx`, `bench/floating-date.test.ts`; criterion + matcher added to `src/archetypes/temporal-integrity.ts` + `src/adapter-react/temporal-integrity.ts` (now dual-seam: `instant` / `floating-date`).

**Executed detection 33/33 → 34/34, false-alarm 0, still 11 archetypes.** temporal-integrity now has 2 of 3 criteria executed. Remaining frontier: `clock-not-frozen` (relative-time/countdown reflects live clock, not a module-load-frozen value) — weakly grounded in the locally-cloned repos (cal.com is timezone-heavy, not stale-now-heavy); needs a real diff before executing, do NOT mold. [[56c99789]]
