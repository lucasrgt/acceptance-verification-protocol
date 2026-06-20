---
id: 91ba3293-a2cc-469b-9d60-57785535f5c5
slug: catalog
type: project
title: authorization now 3-seam over HTTP — server-is-authoritative (23/23)
tags: 
provenance: observado
evidence: bench/server-authoritative.test.ts green (detection 1/1, mutation 5/5); bench/authorization.test.ts still green; npx vitest run = 19 files/79 tests pass; npx tsc --noEmit clean; protocol regenerated (drift-guard pass)
decay: stable
created: 2026-06-20T16:25:24.806765800+00:00
updated: 2026-06-20T16:25:24.806765800+00:00
validated: 2026-06-20T16:25:24.806765800+00:00
links: 
---

authorization is now a THREE-criterion backend archetype over the HTTP adapter (was 2), all seam-gated. New criterion `server-is-authoritative`: the server records its own truth (price/version/quantity), never the client's word. The probe writes the SAME resource several times with DIFFERENT client-tampered values and asserts every recorded value === serverTruth — a constancy invariant that needs no per-value hardcoding and catches "server trusts the client" without false positives even when a tampered value coincidentally equals the truth.

Pattern extended: HttpAuthSubject now has a third optional seam (writes / readRecorded / serverTruth); httpProbe fires the writes and the `serverIsAuthoritative` matcher compares via JSON.stringify; authHooks.applies gates on `requires:'authority'`. Existing authorization bench (ownership/role) stays green — those criteria are skipped for the tamper subject, not failed.

Faithful escape (not molded): the bad servers let the client value leak via echo / min (cheaper-price-wins) / fallback / clamp / average. GOOD records the catalog price regardless. node:http repro `bench/dataset/authority-server.ts` (6 variants), bench `bench/server-authoritative.test.ts`.

Provenance (verified in the bitwarden blobless clone): `bitwarden:ae5508d14` "Restrict users from sending altered project name/value and it being saved to the database" (exact shape — altered client value persisted) + `bitwarden:3b5bb7680` server-side storage-limit bypass. Local: marketplace recorded the client-sent terms version (docs/catalog.md #7).

Hardening: 5-mutant trust-the-client family (echo/min/fallback/clamp/average), all KILLED, authoritative GOOD benign (5/5).

Running ledger after iteration 3: 23/23 executed detection, false-alarm 0, across 9 archetypes, two substrates. authorization=3 criteria, integration-integrity=2 — both multi-seam over HTTP. React mutation 17/17; HTTP mutation families: money 5/5 + redirect 6/6 + authority 5/5. See docs/catalog.md.
