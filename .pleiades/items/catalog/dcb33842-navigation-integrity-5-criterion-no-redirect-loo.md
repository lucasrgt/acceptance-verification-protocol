---
id: dcb33842-a52a-4345-9551-72fbd8f09255
slug: catalog
type: project
title: navigation-integrity 5-criterion — no-redirect-loop (30/30); bounded-storm pattern
tags: 
provenance: observado
evidence: bench/redirect-loop.test.ts green (detection 1/1, mutation 3/3, no hang after CAP bounding); npx vitest run = 26 files/109 tests pass; npx tsc --noEmit clean; protocol regenerated (drift guard initially caught the missing regen); leak-scan clean
decay: stable
created: 2026-06-20T17:16:10.917017900+00:00
updated: 2026-06-20T17:16:10.917017900+00:00
validated: 2026-06-20T17:16:10.917017900+00:00
links: 
---

navigation-integrity is now a FIVE-criterion FE archetype (was 4). New criterion `no-redirect-loop`: opened where a guard fires, the router must settle in finitely many hops — never bounce between routes forever (a replace-in-effect storm). Router-mounted; the routerProbe captures the router instance and subscribes to 'onBeforeLoad' to COUNT route-load hops; the matcher fails when hops > maxHops (default 8) or the mount throws a redirect/loop error. New `redirectLoop` seam on RouterNavSubject; navProbe got a throwing stub; navHooks gates by seam.

KEY GOTCHA (cost me a hung test): a GENUINELY infinite redirect loop in TanStack hangs the test — the unbounded async redirect storm never lets vitest settle (had to taskkill node). FIX: the repro caps the bounce with a per-router hop counter (CAP=20, above maxHops=8) so the storm TERMINATES while preserving the "too many hops" signature. A real infinite loop and a CAP-bounded storm are identical to the criterion (both fail to settle in finitely-few hops) — this is faithful, not molding. Repro `bench/dataset/redirect-loop.tsx` (good=2 hops; two-cycle/three-cycle/always-redirect storms). bench `bench/redirect-loop.test.ts`.

Also: ALWAYS regenerate protocol/catalog.json (ASSAY_WRITE_PROTOCOL=1 npx vitest run protocol-sync) after adding a criterion — the drift guard caught me this iteration (added the criterion, forgot the artifact → 1 failed). Regenerated → green.

Provenance (verified in the documenso clone, Node/TS): `documenso:849885b5` "redirect to /dashboard if auth user tries to access /login or /signup" + `documenso:ef79eb3c` "redirect signin page to dashboard when logged in" — auth-redirect guards that must be fixed points (the loop's family). Local: marketplace role-select infinite redirect loop (docs/catalog.md #1).

Hardening: 3-mutant loop-topology family (two-cycle / three-cycle / always-redirect), all KILLED, fixed-point GOOD benign (3/3).

Running ledger after iteration 10: 30/30 executed detection, false-alarm 0, across 10 archetypes, two substrates. Multi-seam: authorization=3, integration=3, navigation=5, data-honesty=4, persona=2, lifecycle-gate=2(cross-substrate). FE mutation: React 17/17 + param-guard 4/4 + count 4/4 + persona-route 4/4 + blocked-action 4/4 + redirect-loop 3/3; HTTP mutation: money 5/5 + redirect 6/6 + authority 5/5 + lifecycle 4/4 + callback 4/4.

Remaining backlog: action-effect optimistic-reconcile / cache-cleared-on-identity (FE, hero archetype, need bespoke optimistic-update / identity-switch flows). Reminder: anonymization-map history scrub still pending; loop = local only.
