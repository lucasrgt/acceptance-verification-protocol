---
id: 56c99789-f4be-40c3-8347-f4ea0ee4ee60
slug: catalog
type: project
title: temporal-integrity archetype — new escape class mined cross-stack (zoned-to-user executed)
tags: 
provenance: observado
evidence: commit 24d0479 (pushed 7feffce..24d0479); node tools/escape-miner/mine.cjs dev/_acervo/cal.com → temporal-integrity:114 (4th-largest); documenso:1; bitwarden:0; bench/temporal-integrity.test.ts detection 1/1 + mutation 5/5; full suite 30 files/125 tests green, tsc 0
decay: stable
created: 2026-06-20T17:58:26.870515700+00:00
updated: 2026-06-20T17:58:26.870515700+00:00
validated: 2026-06-20T17:58:26.870515700+00:00
links: 
---

**Iteration (step 3 — mine new domains): first genuinely NEW archetype since the runtime catalog closed.**

`temporal-integrity` — "time is correct: an instant is shown in the user's timezone". A FE archetype, DOM-observable. First criterion **`zoned-to-user`** EXECUTED: a stored UTC instant displayed in UTC / server zone / the lazy `new Date(iso).toISOString().slice(0,10)` instead of the viewer's IANA zone renders a day off at a boundary — invisible to a test pinned to one instant in one zone.

**Why it's grounded, not taste:** the marketplace corpus that built the catalog had NO temporal archetype (its time handling was simple). Mining a fresh domain where time IS the product surfaced it: **cal.com (scheduling) = 114 classified temporal escapes, the 4th-largest archetype in the repo** (behind navigation 188, second-order 187, integration 164). documenso=1, bitwarden=0 → temporal-integrity is **domain-weighted, not universal** (opposite profile from authz/second-order/integration which appear in every repo). cal.com added to `docs/corpus-multistack.md` as the 7th repo; miner gained a temporal classifier.

**Deterministic verifier (the key design):** instant `2025-01-01T02:00:00Z` is `2024-12-31` in America/Sao_Paulo (UTC-3, no DST) but `2025-01-01` in UTC. The probe computes the user-zone date via explicit `Intl.DateTimeFormat('en-CA',{timeZone})` (host-independent — does NOT rely on process.env.TZ), reads the rendered ISO date, asserts it equals the user-zone day and not the UTC day. Mutation family 5/5: utc, iso-slice, tokyo, server-london, raw-iso — all render the day AHEAD, all die; user-zoned GOOD stays green.

Files: `src/archetypes/temporal-integrity.ts`, `src/adapter-react/temporal-integrity.ts`, `bench/dataset/temporal-readout.tsx`, `bench/temporal-integrity.test.ts`. Wired in protocol.ts + index.ts + adapter-react/verify.ts REGISTRY.

**Executed detection now 33/33, false-alarm 0, 11 archetypes.** Frontier of this archetype (catalogued, NOT yet executed — next iterations): `clock-not-frozen` (relative-time/countdown reflects live clock, not a module-load-frozen value) and `floating-date-not-shifted` (a date-only value never zone-shifted by a `new Date()` round-trip). seenIn: documenso:22fd1b5b, calcom:c1d0a6bb, calcom:d70fa462. [[61e706fe]]
