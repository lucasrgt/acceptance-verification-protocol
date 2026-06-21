---
id: 412d5f1b-94ff-42ac-9fad-6b65bb6d2595
slug: catalog
type: project
title: lifecycle-gate now CROSS-SUBSTRATE — blocked-action-is-disabled (DOM) + gate-enforced-server-side (HTTP) (29/29)
tags: 
provenance: observado
evidence: bench/blocked-action.test.ts green (detection 1/1, mutation 4/4); bench/lifecycle-gate.test.ts (HTTP) still green; both cross-substrate criteria assert the other is skipped; npx vitest run = 25 files/105 tests pass; npx tsc --noEmit clean; protocol regenerated
decay: stable
created: 2026-06-20T17:05:16.400187+00:00
updated: 2026-06-20T17:05:16.400187+00:00
validated: 2026-06-20T17:05:16.400187+00:00
links: 
---

lifecycle-gate is the FIRST archetype EXECUTED ACROSS BOTH SUBSTRATES — its server half `gate-enforced-server-side` runs over HTTP (iteration 6) and its DOM half `blocked-action-is-disabled` now runs in React. One archetype gated at both layers = the "determinism is layered" thesis made concrete (a major demonstration point).

New criterion `blocked-action-is-disabled` (React/DOM): with a precondition unmet, the action control must be disabled (real `disabled` or aria-disabled='true') AND say why — not a live control the user clicks into a failure. New React adapter `src/adapter-react/lifecycle-gate.ts` (ReactLifecycleSubject + lifecycleFeProbe + lifecycleFeHooks), registered in adapter-react/verify.ts REGISTRY ('lifecycle-gate'). Repro `bench/dataset/blocked-action.tsx` (good + 4 mutants: enabled / enabled-styled (className only) / aria-false (lies) / no-reason). bench `bench/blocked-action.test.ts`.

KEY PATTERN — one archetype, two adapters: the two criteria each carry a `requires` seam (gate-enforced-server-side → 'transition'; blocked-action-is-disabled → 'blocked'). The HTTP adapter's lifecycleHooks.applies skips anything requiring 'blocked'; the React adapter's lifecycleFeHooks.applies skips anything requiring 'transition'. So running via HTTP → only the server criterion; via React → only the DOM criterion; each cross-substrate criterion is honestly SKIPPED on the other adapter (asserted in both benches). Each adapter's probe also carries a throwing STUB for the other criterion's matcher (the Probe<Expect> type requires all methods, but applies prevents them being called).

Faithful (not molded): the bad screens offer the blocked action four ways — a live button, one that only LOOKS disabled (className), an aria-disabled='false' lie, and a disabled button with no reason. All killed; correctly-disabled GOOD benign.

Provenance (verified in the documenso clone, Node/TS): `documenso:41ed6c9a` "disable cert download when document not complete" (exact shape — action disabled when precondition unmet) + `documenso:6d754acf` "disable edit signer inputs". Local: marketplace publishing offered on an incomplete listing (docs/catalog.md #4).

Running ledger after iteration 9: 29/29 executed detection, false-alarm 0, across 10 archetypes, two substrates. lifecycle-gate=2 (cross-substrate). FE mutation: React 17/17 + param-guard 4/4 + count-source 4/4 + persona-route 4/4 + blocked-action 4/4; HTTP mutation: money 5/5 + redirect 6/6 + authority 5/5 + lifecycle 4/4 + callback 4/4.

Remaining FE backlog: action-effect optimistic-reconcile / cache-cleared-on-identity, navigation no-redirect-loop. Reminder: anonymization-map history scrub still pending; loop = local only.
