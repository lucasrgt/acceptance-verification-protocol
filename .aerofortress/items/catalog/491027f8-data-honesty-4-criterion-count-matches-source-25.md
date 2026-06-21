---
id: 491027f8-0408-426f-872c-48a99dcf3fb9
slug: catalog
type: project
title: data-honesty 4-criterion — count-matches-source (25/25)
tags: 
provenance: observado
evidence: bench/count-source.test.ts green (detection 1/1, mutation 4/4); existing data-honesty + data-detail benches still green; npx vitest run = 21 files/87 tests pass; npx tsc --noEmit clean; protocol regenerated; leak-scan of tracked tree clean
decay: stable
created: 2026-06-20T16:40:29.903042400+00:00
updated: 2026-06-20T16:40:29.903042400+00:00
validated: 2026-06-20T16:40:29.903042400+00:00
links: 
---

data-honesty is now a FOUR-criterion FE archetype (was 3). New criterion `count-matches-source`: the number of items rendered must equal the number the API returned — a client-side filter/fixture-merge never silently drops or invents rows. Runs under the `success` condition (the populated response), gated by the `count` seam alongside the empty/partial/detail criteria.

Implementation: DataHonestySubject gained `countResponse?: readonly unknown[]`; driveData now serves countResponse under `success` (empty→emptyResponse, partial→mediaResponse, success→countResponse); the `countMatchesSource` matcher compares itemCount() to countResponse.length. applies gates on `requires:'count'` (skipped when no countResponse) so the existing fixture/media/detail subjects are untouched. detailProbe got a throwing stub.

Repro `bench/dataset/count-feed.tsx` (5 variants): good renders the API rows as-is; mutants = drop-filter (stale client allowlist drops rows) / inject-featured (prepends a fixture) / pad-to-min (pads to 4) / dedup-bug (de-dup on a non-unique field collapses rows). bench `bench/count-source.test.ts`.

Provenance (verified in the documenso blobless clone, Node/TS frontend): `documenso:b8e08e88` "api keys not showing" (source rows dropped from the list) + `documenso:5f4e0ccf` "exclude rejected documents from inbox count" (count ≠ true source). Honest cross-stack FE confirmation; no private marketplace hash fabricated.

Running ledger after iteration 5: 25/25 executed detection, false-alarm 0, across 9 archetypes, two substrates. Multi-seam archetypes: authorization=3, integration-integrity=2, navigation-integrity=4, data-honesty=4. FE mutation: React 17/17 + param-guard 4/4 + count-source 4/4; HTTP mutation: money 5/5 + redirect 6/6 + authority 5/5.

Reminder (still pending from iteration 4): repo HAS a public remote; the anonymization map [[public-repo-anonymization-map-no-private-project]] is now untracked but still sits in the iteration-1 LOCAL commit — needs a history scrub before any push. Loop = local commits only; do NOT push.
