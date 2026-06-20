---
id: 61e706fe-b411-4f94-a799-58cace333449
slug: catalog
type: project
title: action-effect 9-criterion — optimistic-reconcile (32/32); ALL catalogued RUNTIME criteria executed
tags: 
provenance: observado
evidence: bench/optimistic-reconcile.test.ts green (detection 1/1, mutation 3/3); existing action-effect accuracy bench still green; npx vitest run = 28 files/117 tests pass; npx tsc --noEmit clean; protocol regenerated (32 criteria); leak-scan clean
decay: stable
created: 2026-06-20T17:28:06.512647700+00:00
updated: 2026-06-20T17:28:06.512647700+00:00
validated: 2026-06-20T17:28:06.512647700+00:00
links: 
---

MILESTONE: with `optimistic-reconcile`, EVERY catalogued RUNTIME criterion is now executed (32/32 detection, false-alarm 0, across 10 archetypes, two substrates). What remains catalogued-but-not-executed is exclusively STATIC (host-doctor territory, by design — contract-mints-no-routes, state-completeness, i18n-honesty, money-is-typed, money-formatted-once). The FE/DOM + BE/HTTP runtime reach is complete.

action-effect is now 9 criteria. New criterion `optimistic-reconcile`: an optimistic count bump must reconcile to the server's authoritative value — when the response differs from the optimistic guess, the UI settles on server truth (no permanent drift). Reuses the existing action drive() (not a new probe shape): added a `reconcile` seam to ActionEffectSubject ({ readout:{role,name?}, serverCount }); reactProbe.optimisticReconcile reads the readout's number (parseInt) after the action settles and compares to serverCount; gated by requires:'reconcile'. identityProbe got an optimisticReconcile stub. Repro `bench/dataset/optimistic-counter.tsx` (start 10, server truth 12, optimistic 11): good reconciles→12; mutants no-reconcile(11)/wrong-merge(23)/revert-stale(10), all ≠12 → killed. bench `bench/optimistic-reconcile.test.ts`. (Pick server/optimistic values so NO bad variant coincidentally equals serverCount — avoided double-optimistic which would land on 12 and false-pass.)

Provenance (verified in documenso clone): `documenso:eb45d1e5` "reconcile billing when stripe subscription is missing" (literal reconcile-to-truth) + `documenso:ed7a0011` "sync envelope state after direct link changes". Local: marketplace count-based optimistic state never reconciled (docs/catalog.md #3).

Hardening: 3-mutant optimistic-drift family, all KILLED, reconciling GOOD benign (3/3).

FINAL LEDGER after iteration 12: 32/32 executed detection, false-alarm 0, 10 archetypes, two substrates. Per-archetype: action-effect=9, data-honesty=4, persona=2, navigation=5, mount-stability=1, authorization=3, integration-integrity=3, second-order=1, money-integrity=1, lifecycle-gate=2(cross-substrate). Mutation: React 17/17 + 6 FE families (param-guard/count/persona-route/blocked-action/redirect-loop/cache-identity/optimistic = 4+4+4+4+3+3+3) + 5 HTTP families (money 5/redirect 6/authority 5/lifecycle 4/callback 4).

STOP CONDITION likely MET next round: a mining+selection round finds no high-value CATALOGUED criterion uncovered with an available adapter (only STATIC left). To continue beyond, would need to MINE NEW escape classes from the acervo (documenso/bitwarden) not yet in the catalog — a discovery mode, not execution of the existing dictionary.

Reminder: anonymization-map [[public-repo-anonymization-map-no-private-project]] history scrub still pending before any push; loop = local commits only.
