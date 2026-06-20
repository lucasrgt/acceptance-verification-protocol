---
id: 0ead4f1a-4d08-4ab8-bb07-d8b847e081bb
slug: catalog
type: project
title: request-idempotency archetype — idempotency-key-honored executed (BE/HTTP, single-flight's server twin)
tags: 
provenance: observado
evidence: commit c9567e9 (e280600..c9567e9); bench/idempotency.test.ts detection 1/1 + mutation 4/4; full suite 36 files/149 tests green, tsc 0; faithful repro cal.com d85e0b51 (confirmed diff: server-side idempotency key prevents duplicate bookings)
decay: stable
created: 2026-06-20T18:39:57.470937500+00:00
updated: 2026-06-20T18:39:57.470937500+00:00
validated: 2026-06-20T18:39:57.470937500+00:00
links: 
---

**Iteration 7 — new BE archetype `request-idempotency`** (14th archetype), over the HTTP adapter. Criterion `idempotency-key-honored`: a mutation carrying an idempotency key is applied at most once.

**The pairing:** this is the SERVER twin of action-effect's `single-flight` (FE). single-flight guards the button in the client; request-idempotency guards the effect at the server. Together they're the "exactly-once" story at both layers — the same shape that motivated lifecycle-gate (FE+BE) and money-integrity (display+at-rest), but across two ARCHETYPES rather than one.

**Verifier:** node:http repro server (per loop convention: node puro, .ts). Probe fires create twice with SAME key (must yield one id, the original replayed) + once with DIFFERENT key (must yield a distinct id — dedup scoped to the key). Mutation 4/4: no-idempotency (ignores key → duplicate), key-in-body (reads key from body, request sends header → never dedups), dedup-all (returns fixed id → distinct ops collide, caught by the different-key control), expires-now (stores then drops the key → never replays). All sequentially reproducible (probe awaits each request); all die; GOOD green.

**Provenance discipline note:** initially wrote a FABRICATED seenIn hash (`documenso:idempotent-stripe`); caught it and replaced with the real verified hash `documenso:3887aa67` ("rework stripe webhooks into idempotent subscription sync") + `31be5489`. Never ship a placeholder hash — grep the real one first. seenIn: calcom:d85e0b51 (confirmed diff), documenso:3887aa67, documenso:31be5489.

Files: `src/archetypes/request-idempotency.ts`, `src/adapter-http/idempotency.ts`, `bench/dataset/idempotency-server.ts`, `bench/idempotency.test.ts`; HttpIdempotencySubject in adapter-http/subject.ts; registered in adapter-http/verify.ts + protocol.ts + index.ts.

**Executed detection 38/38 → 39/39, false-alarm 0, 14 archetypes.** Step-3 harvest: 7 criteria, 4 new archetypes (temporal, pagination, render-resilience, request-idempotency) + 2 cross-substrate extensions (single-flight, money-display) across 4 domains + new HTTP backend coverage. The clearly-grounded FE/HTTP frontier is now very thin. [[38cf53fa]]
