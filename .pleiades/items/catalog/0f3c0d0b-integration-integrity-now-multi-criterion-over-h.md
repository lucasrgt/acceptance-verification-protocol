---
id: 0f3c0d0b-2a2d-4946-ac2d-665236155379
slug: catalog
type: project
title: integration-integrity now multi-criterion over HTTP — redirect-urls-bound (22/22)
tags: 
provenance: observado
evidence: bench/redirect-bound.test.ts green (detection 1/1, mutation 6/6); bench/integration.test.ts still green after refactor; npx vitest run = 18 files/74 tests pass; npx tsc --noEmit clean; protocol regenerated (drift-guard pass)
decay: stable
created: 2026-06-20T16:20:32.315068400+00:00
updated: 2026-06-20T16:20:32.315068400+00:00
validated: 2026-06-20T16:20:32.315068400+00:00
links: 
---

integration-integrity is now a MULTI-CRITERION backend archetype over the HTTP adapter (1 → 2 criteria), seam-gated the way authorization is. New criterion `redirect-urls-bound`: a checkout/OAuth flow must bind its return URLs to the real environment — every required transition (success, failure) present, an absolute http(s) URL, never a placeholder/dev host (localhost/127.0.0.1/example.*), relative path, or wrong origin.

Pattern (reusable for any multi-seam backend archetype): the HTTP subject `HttpIntegrationSubject` carries BOTH seams optionally (webhook: forged/valid; checkout: checkout/readReturnUrls/requiredTransitions/expectedOrigin). The archetype criteria get a `requires` seam key ('webhook' / 'checkout'); `webhookHooks.applies` returns a skip reason when the subject lacks that seam → the unrelated criterion is honestly SKIPPED (not failed, not silently passed). `requires` is NOT serialized into protocol/catalog.json (only id/statement/oracle/scope/condition/seenIn are), so adding seam keys to existing criteria leaves the protocol artifact unchanged except for the genuinely-new criterion.

Renames this iteration: `HttpWebhookSubject` → `HttpIntegrationSubject`; `webhookProbe` → `integrationProbe` (kept `webhookHooks`). Files: src/adapter-http/integration.ts (both seams + urlProblem helper with PLACEHOLDER_HOSTS), subject.ts, archetypes/integration-integrity.ts, bench/dataset/checkout-server.ts (node:http, 7 variants), bench/redirect-bound.test.ts.

Provenance (real, verified in the bitwarden blobless clone): missing/added RedirectUris fixes `bitwarden:aa1665065` ("add missing RedirectUris") + `bitwarden:004e3c58e` — the exact "missing back_urls / wrong redirect" shape, cross-stack in .NET.

Hardening: 6-mutant family (missing / null-urls / localhost / placeholder-host / partial / relative) — all KILLED, bound GOOD checkout benign (6/6).

Running ledger after iteration 2: 22/22 executed detection, false-alarm 0, across 9 archetypes, two substrates. React mutation 17/17 unchanged; HTTP mutation families now: money 5/5 + redirect 6/6. See docs/catalog.md status table.
