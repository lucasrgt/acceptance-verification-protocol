---
id: f7852ada-b296-4ccf-9c15-ad603d81aca4
slug: catalog
type: project
title: action-effect · single-flight executed (double-submit guard; new double-activate condition)
tags: 
provenance: observado
evidence: commit e592d64 (10cc279..e592d64); bench/double-submit.test.ts detection 1/1 + mutation 4/4; full suite 32 files/133 tests green, tsc 0; grounded across cal.com d7226fc3/5b50a469 + documenso 56683aa9
decay: stable
created: 2026-06-20T18:12:31.444688600+00:00
updated: 2026-06-20T18:12:31.444688600+00:00
validated: 2026-06-20T18:12:31.444688600+00:00
links: 
---

**Iteration 3 — pivoted from temporal to action-effect.** First grounded a clock-not-frozen search: the "stale" hits in cal.com/documenso are cache/projection staleness (already covered), NOT a frozen-`now` relative-time bug → clock-not-frozen stays UNDER-GROUNDED in the local acervo, did NOT mold it (gold rule). Instead mined cal.com's unclassified bucket: availab*=133, slot=81, duplicate=58 — but availability/slot logic is scheduling-specific + BE-leaning (low cross-domain transfer, below the AVP-archetype bar). The domain-NEUTRAL signal there is **double-submit**.

`single-flight` (under action-effect): a fast double-activation must fire the effect once, not twice — a primary action guards itself in flight (disables on submit). The no-failure sibling of idempotent-retry (no error, only click concurrency).

**Mechanism (new probe substrate):** added a `double-activate` interaction condition to the protocol + `drive`. The driver clicks twice in quick succession against a SLOW endpoint (delay 50) so a correct guard has time to commit its disabled state (React re-render) between the two awaited userEvent clicks; firesOnce() counts endpoint hits (must be 1). Seam: `singleFlight?: boolean` on ActionEffectSubject; gated in verify.ts applies(). NOTE: had to add the `firesOnce` stub to identity.ts (it implements ActionEffectExpect) — adding a method to that interface means updating BOTH probe.ts and identity.ts or tsc breaks.

**Grounded across two repos:** cal.com d7226fc3 "disable button and handle submit when loading", 5b50a469 "double bookings on seated event"; documenso 56683aa9 "disable signing pad while submitting". Mutation 4/4: unguarded, aria-disabled lie, visual-only className, guard-set-after-await — all double-fire, all die; GOOD (real `disabled` attr) single-flight.

**Executed detection 34/34 → 35/35, false-alarm 0, 11 archetypes.** Frontier still open: temporal `clock-not-frozen` (needs a real frozen-clock diff — not in local acervo yet). [[12776b8f]]
