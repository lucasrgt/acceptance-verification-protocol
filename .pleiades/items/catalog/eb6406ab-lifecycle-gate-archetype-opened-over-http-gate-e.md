---
id: eb6406ab-f411-4b0f-8d22-f92adedb8fb2
slug: catalog
type: project
title: lifecycle-gate archetype opened over HTTP — gate-enforced-server-side (26/26, 10 archetypes)
tags: 
provenance: observado
evidence: bench/lifecycle-gate.test.ts green (detection 1/1, mutation 4/4); npx vitest run = 22 files/92 tests pass; npx tsc --noEmit clean; protocol regenerated (10 archetypes); leak-scan clean
decay: stable
created: 2026-06-20T16:45:49.665854200+00:00
updated: 2026-06-20T16:45:49.665854200+00:00
validated: 2026-06-20T16:45:49.665854200+00:00
links: 
---

lifecycle-gate is now an EXECUTED archetype (was 0 → 1), opening the 10th archetype on the ledger. Criterion `gate-enforced-server-side` (HTTP): a state transition (publish/go-live/sign) requested on a resource whose precondition is unmet must be refused server-side (4xx), AND a ready resource's transition must still succeed (so the criterion isn't fooled by a server that rejects everything). The escape: the FE disables the button but the server doesn't enforce, so a direct request transitions a not-ready resource.

Probe `src/adapter-http/lifecycle.ts` (lifecycleProbe/lifecycleHooks): fires `transition` (unmet, even with client lying `ready:true`) and `whenReady` (ready). Subject `HttpLifecycleSubject` (transition/whenReady/rejectWith). Registered in verify.ts REGISTRY. Single criterion → no seam gating. node:http repro `bench/dataset/lifecycle-server.ts` (precondition = complete && verified; draft-1 complete-but-unverified must be refused, ready-1 allowed). bench `bench/lifecycle-gate.test.ts`.

Faithful (not molded): the bad servers bypass the gate four ways — no-check / trust-client-flag (trusts body.ready) / check-complete-only (forgets verified) / or-not-and (wrong boolean). All return 2xx on the unmet transition → killed. GOOD ignores the client flag, checks server state → 422.

Provenance (verified in the blobless clones): `documenso:6e09a470` "prevent signing draft documents" (a transition refused on a not-ready resource — exact shape, Node/TS) + `bitwarden:43d14971f` "Prevent Existing Non Confirmed and Accepted SSO Users" (.NET precondition gate). Local: marketplace go-live/publish gated only client-side (docs/catalog.md #4).

Hardening: 4-mutant client-only-gate family, all KILLED, enforcing GOOD benign (4/4).

Running ledger after iteration 6: 26/26 executed detection, false-alarm 0, across 10 archetypes, two substrates. Executed archetypes: action-effect, data-honesty(4), persona, navigation(4), mount-stability, authorization(3), integration-integrity(2), second-order-effects, money-integrity, lifecycle-gate. HTTP mutation: money 5/5 + redirect 6/6 + authority 5/5 + lifecycle 4/4; FE mutation: React 17/17 + param-guard 4/4 + count-source 4/4.

Reminder (still pending): repo has a public remote; anonymization map [[public-repo-anonymization-map-no-private-project]] untracked but in iteration-1 local commit — history scrub needed before any push. Loop = local commits only.
