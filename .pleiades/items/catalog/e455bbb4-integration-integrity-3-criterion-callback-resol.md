---
id: e455bbb4-81e5-4664-ab28-5202e55c1c78
slug: catalog
type: project
title: integration-integrity 3-criterion — callback-resolves-entity (27/27)
tags: 
provenance: observado
evidence: bench/callback-resolves.test.ts green (detection 1/1, mutation 4/4); existing webhook + redirect benches still green; npx vitest run = 23 files/97 tests pass; npx tsc --noEmit clean; protocol regenerated; leak-scan clean
decay: stable
created: 2026-06-20T16:50:43.218343900+00:00
updated: 2026-06-20T16:50:43.218343900+00:00
validated: 2026-06-20T16:50:43.218343900+00:00
links: 
---

integration-integrity is now a THREE-criterion backend archetype over HTTP (was 2). New criterion `callback-resolves-entity`: an inbound callback must carry enough to resolve the domain entity it concerns — a callback with a missing/unknown reference is refused (422), never accepted-and-silently-dropped or applied to the wrong entity; a resolvable callback still succeeds (guards against "rejects everything").

Third seam added to HttpIntegrationSubject (unresolvable / resolvable), gated by `requires:'resolve'` in webhookHooks.applies (skipped when no unresolvable). integrationProbe now fires all three seams (webhook / checkout / resolve) and implements callbackResolvesEntity. node:http repro `bench/dataset/callback-server.ts` (good + 4 mutants), bench `bench/callback-resolves.test.ts`.

Faithful (not molded): the bad servers accept an unresolvable callback four ways — no-validation / default-entity (missing id → mutates a default charge, the dangerous mis-application) / ignored-lookup (looks up, discards the not-found result) / loose-gate (buggy truthiness). All 2xx on the no-chargeId payload → killed. GOOD resolves against the store → 422 on missing, 200 on ch_1.

Provenance (verified in the documenso blobless clone, Node/TS): `documenso:a99bdf5e` "include envelopeId in webhook payload" (payload lacked the entity reference — exact shape) + `documenso:8fbace0f` "viewed webhook had stale data". Local: marketplace webhook arriving without the charge id (docs/catalog.md #5).

Running ledger after iteration 7: 27/27 executed detection, false-alarm 0, across 10 archetypes, two substrates. Multi-seam: authorization=3, integration-integrity=3, navigation-integrity=4, data-honesty=4. HTTP mutation: money 5/5 + redirect 6/6 + authority 5/5 + lifecycle 4/4 + callback 4/4; FE mutation: React 17/17 + param-guard 4/4 + count-source 4/4.

Reminder (still pending): repo has a public remote; anonymization map [[public-repo-anonymization-map-no-private-project]] untracked but in iteration-1 local commit — history scrub needed before any push. Loop = local only.
