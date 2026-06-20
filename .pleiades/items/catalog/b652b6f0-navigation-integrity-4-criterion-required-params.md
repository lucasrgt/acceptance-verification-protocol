---
id: b652b6f0-cb6b-4c2f-bca9-644422a14a76
slug: catalog
type: project
title: navigation-integrity 4-criterion — required-params-guarded (24/24); FE pivot via documenso acervo
tags: 
provenance: observado
evidence: bench/navigation-params.test.ts green (detection 1/1, mutation 4/4); npx vitest run = 20 files/83 tests pass; npx tsc --noEmit clean; protocol regenerated; leak-scan of tracked tree clean; git rev-list origin/main...HEAD shows unpushed local-only commits
decay: stable
created: 2026-06-20T16:35:17.961457900+00:00
updated: 2026-06-20T16:35:17.961457900+00:00
validated: 2026-06-20T16:35:17.961457900+00:00
links: 
---

navigation-integrity is now a FOUR-criterion FE archetype (was 3). New criterion `required-params-guarded`: a route that needs a param, mounted without it, must redirect to a real parent (fallbackMarker present) and must NOT render the detail with a missing/empty param (ghostMarker absent). Router-mounted probe (RouterNavSubject + paramGuard seam), gated by seam alongside nested-renders/back-has-fallback. Faithful escape (marketplace's param-less chat thread ghost).

Repro `bench/dataset/param-route.tsx` (TanStack memory router, 5 variants): good guards `!thread` (redirects on absent OR empty); mutants = no-guard / empty-allowed (guards only `=== undefined`, so `?thread=` empty slips through) / spinner / blank. bench `bench/navigation-params.test.ts`. Gotcha hit: the inbox list text must not contain the ghost marker word ("Conversation") or GOOD false-alarms — renamed to "Chat with Ana".

Provenance (verified in a NEW blobless acervo clone — documenso, Node/TS frontend): `documenso:184cbd67` "guard missing password reset token and fix broken reset link URL" (exact shape) + `documenso:04b1ce1a` "missing not found page for deleted documents". Cross-stack FE confirmation, honest — no private marketplace hash fabricated.

SAFETY INCIDENT found + contained: the repo HAS a public remote (origin → github.com/lucasrgt/acceptance-verification-protocol), contradicting the loop's "avp has no remote". The `.pleiades/` dir is tracked/public (only index.db ignored), so every item must be neutral. In iteration 1 I wrongly `git add -A`'d the pre-existing untracked anonymization map [[public-repo-anonymization-map-no-private-project]] (fc2e2566) which contains the private names — a latent leak. NOTHING was pushed (origin still at release f7c2337; loop = local commits only). Fixed: fc2e2566 untracked + added to .pleiades/.gitignore. STILL PENDING: fc2e2566 remains in the iteration-1 LOCAL commit history — a history scrub is needed before any push. RULE: never push in this loop; the anonymization map belongs local-only/vault, never tracked.

Running ledger after iteration 4: 24/24 executed detection, false-alarm 0, across 9 archetypes, two substrates. authorization=3, integration-integrity=2, navigation-integrity=4 (all multi-seam). HTTP mutation families: money 5/5 + redirect 6/6 + authority 5/5; FE mutation: React 17/17 + param-guard 4/4.
