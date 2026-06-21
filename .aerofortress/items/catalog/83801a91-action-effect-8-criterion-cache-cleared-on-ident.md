---
id: 83801a91-2b96-4ba6-874e-cd5f9ce35b3a
slug: catalog
type: project
title: action-effect 8-criterion — cache-cleared-on-identity (31/31)
tags: 
provenance: observado
evidence: bench/cache-identity.test.ts green (detection 1/1, mutation 3/3); existing action-effect benches (accuracy 3/3, action-tail 3/3) still green; npx vitest run = 27 files/113 tests pass; npx tsc --noEmit clean; protocol regenerated
decay: stable
created: 2026-06-20T17:22:56.567712900+00:00
updated: 2026-06-20T17:22:56.567712900+00:00
validated: 2026-06-20T17:22:56.567712900+00:00
links: 
---

action-effect (the hero archetype) is now EIGHT criteria (was 7). New criterion `cache-cleared-on-identity`: after signing out of A and into B, the UI must show B's rows, never A's cached rows — a stale-cache-across-identity privacy/security leak. New probe SHAPE: identity flow. actionEffectHooks now dispatches by subject shape — isIdentitySubject (declares responsesByUser) → identityProbe; else reactProbe. Each criterion gated by shape: cache-cleared-on-identity only on identity subjects; the seven action criteria skipped for identity subjects (and vice versa) — asserted in the bench.

New `src/adapter-react/identity.ts`: IdentitySubject (render/endpoint/responsesByUser/switchControl/priorMarker/nextMarker) + identityProbe + isIdentitySubject. The probe registers MSW serving rows by the `x-user` header, mounts as A, clicks the switch control, settles, and asserts priorMarker absent + nextMarker present. The identityProbe implements the full ActionEffectExpect (1 real matcher + 7 throwing stubs via a `stub()` helper); reactProbe got a cacheClearedOnIdentity stub.

KEY MODELING CHOICE: the cache is a per-mount useRef (not module-global) — it persists across the in-app sign-out/sign-in (same mount, a button click) but resets between test runs (fresh mount). This models a real query cache surviving a logout WITHOUT a module-global reset problem. Repro `bench/dataset/identity-app.tsx` (good clears cache + refetches B; mutants: stale-cache (constant key) / no-refetch (mount-only load) / stale-identity (fetches with the mount-time identity)). bench `bench/cache-identity.test.ts`.

Provenance (verified in the documenso clone, Node/TS): `documenso:8fca029d` "invalidate sessions on password reset and update" + `documenso:d2976cb1` "render clear cache fix". Local: marketplace prior account's rows feeding the new session (docs/catalog.md #3).

Hardening: 3-mutant cross-identity-cache-leak family, all KILLED, cache-clearing GOOD benign (3/3).

Running ledger after iteration 11: 31/31 executed detection, false-alarm 0, across 10 archetypes, two substrates. action-effect=8. ONLY catalogued criterion left non-executed (non-STATIC): action-effect `optimistic-reconcile`. FE mutation: React 17/17 + param-guard 4/4 + count 4/4 + persona-route 4/4 + blocked-action 4/4 + redirect-loop 3/3 + cache-identity 3/3; HTTP mutation: money 5/5 + redirect 6/6 + authority 5/5 + lifecycle 4/4 + callback 4/4.

Reminder: anonymization-map history scrub still pending; loop = local only, no push.
