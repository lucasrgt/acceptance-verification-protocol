---
id: 12abef8a-9161-4709-a430-efb74a09e8f5
slug: catalog
type: project
title: persona-scoped-visibility 2-criterion — no-cross-persona-route (28/28)
tags: 
provenance: observado
evidence: bench/persona-route.test.ts green (detection 1/1, mutation 4/4); existing persona-visibility bench still green; npx vitest run = 24 files/101 tests pass; npx tsc --noEmit clean; protocol regenerated; leak-scan clean
decay: stable
created: 2026-06-20T16:56:13.965235700+00:00
updated: 2026-06-20T16:56:13.965235700+00:00
validated: 2026-06-20T16:56:13.965235700+00:00
links: 
---

persona-scoped-visibility is now a TWO-criterion FE archetype (was 1). New criterion `no-cross-persona-route`: signed in as actor X, a deep link to an actor-Y-scoped route must redirect X to its own area (guardMarker present) and never render Y's screen (foreignMarker absent). Router-mounted probe `src/adapter-react/persona-router.tsx` (PersonaRouteSubject + personaRouterProbe + isPersonaRouteSubject), mirroring the navigation router pattern. personaHooks now dispatches by subject shape and gates by criterion id (render-as-actor → affordance; router → route) — no `requires` needed, gated in applies. personaProbe got a throwing noCrossPersonaRoute stub.

Repro `bench/dataset/persona-route.tsx` (TanStack memory router at /host/dashboard, actor=traveler): good guards (redirects non-host to /traveler/home); mutants = no-guard / wrong-actor-check (blocks only anonymous) / redirect-wrong (sends to another host route) / splash-only (guard on /login, not the route). bench `bench/persona-route.test.ts`. Gotcha: `const ACTOR='traveler'` infers a literal type → `ACTOR !== 'host'` is a TS2367 error; widen to `const ACTOR: string`.

Provenance (verified in the clones): `documenso:2ba0f48c` "unauthorized access error api tokens page team" (team-scoped page access) + `bitwarden:e4359f071` "Prevent admin-added sponsored families from appearing in individual vault settings" (cross-context page-level leak). Local: marketplace opposite-persona dashboard on a deep link (docs/catalog.md #2).

Hardening: 4-mutant cross-persona-route family, all KILLED, guarded GOOD benign (4/4).

Running ledger after iteration 8: 28/28 executed detection, false-alarm 0, across 10 archetypes, two substrates. Multi-seam: authorization=3, integration-integrity=3, navigation-integrity=4, data-honesty=4, persona=2. FE mutation: React 17/17 + param-guard 4/4 + count-source 4/4 + persona-route 4/4; HTTP mutation: money 5/5 + redirect 6/6 + authority 5/5 + lifecycle 4/4 + callback 4/4.

Remaining FE backlog: action-effect optimistic-reconcile / cache-cleared-on-identity, navigation no-redirect-loop, lifecycle blocked-action-is-disabled. Reminder: anonymization-map history scrub still pending; loop = local commits only, no push.
