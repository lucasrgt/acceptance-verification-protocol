---
id: a7512ac7-f0c4-4bd1-9cb2-fe6cb745184c
slug: catalog
type: project
title: money-integrity executed over HTTP — split-invariant (21/21, 9 archetypes)
tags: 
provenance: observado
evidence: bench/money-integrity.test.ts green (detection 1/1, mutation 5/5); npx vitest run = 17 files/70 tests pass; npx tsc --noEmit clean; protocol/catalog.json regenerated (drift-guard pass)
decay: stable
created: 2026-06-20T16:14:08.547144500+00:00
updated: 2026-06-20T16:14:08.547144500+00:00
validated: 2026-06-20T16:14:08.547144500+00:00
links: 
---

money-integrity is now an EXECUTED archetype (was 0 criteria → 1). Criterion `split-invariant` runs over the HTTP adapter: a 15/85 platform/host split must sum to the whole, exact to the cent, over a swept range of totals, with the platform share matching the policy fraction (±1 cent) and no negative shares.

Faithful escape (not molded): independent float-percentage rounding `round(t*0.15)+round(t*0.85)` leaks a cent (t=10 → 2+9=11). GOOD = integer basis-point math `floor(t*bps/10000)` with remainder to host. Repro server `bench/dataset/money-server.ts` (node:http, .ts), 6 variants. Probe `src/adapter-http/money.ts` (moneyProbe/moneyHooks), subject `HttpMoneySubject` in subject.ts, registered in verify.ts REGISTRY, archetype `src/archetypes/money-integrity.ts`, bench `bench/money-integrity.test.ts`.

Provenance: cross-stack money escape confirmed in .NET — bitwarden currency-culture fixes `bitwarden:2e0e10307` + `bitwarden:6d69c9bb9` (real, verified in the blobless clone). The local 15/85 split is documented in docs/catalog.md #9; no private-repo hash was fabricated. money-integrity appears in 4/6 corpus repos.

Hardening: mutation family of 5 rounding mutants (round-both / floor-both / ceil-both / float-truncate / misproportion) — all KILLED, GOOD benign passes (5/5). HTTP criteria don't fit the React mutants.tsx harness, so the money mutation family is co-located in the money bench (HTTP-shaped). This is the precedent for hardening backend criteria.

Running ledger after this iteration: 21/21 executed detection, false-alarm 0, across 9 archetypes, two substrates (React/DOM + HTTP), 3 projects. React mutation score still 17/17. See docs/catalog.md status table.

Acervo: `dev/_acervo/bitwarden-server` is a blobless clone (gitignored via dev/_acervo/).
