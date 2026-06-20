---
id: cf624b28-807f-40b3-80b5-91fa66d2eedb
slug: specs
type: doc
title: Mutation testing — criterion-robustness harness (Stryker-like) + found+fixed hole
tags: mutation-testing, robustness, stryker, harness, hardening
provenance: observado
evidence: bench/mutation.test.ts; bench/mutation/mutants.tsx; docs/mutation.md; suite 47/47, mutation score 8/8
decay: seasonal
created: 2026-06-20T14:55:29.094774700+00:00
updated: 2026-06-20T14:55:29.094774700+00:00
validated: 2026-06-20T14:55:29.094774700+00:00
links: 
---

Mutation testing for the verifier (user asked: "algo tipo stryker pra mutar e falhar de propósito até ficar robusto"). Two layers:

LAYER 1 (BUILT, AVP-native): mutate the SUBJECTS, archetype-aware. bench/mutation.test.ts + bench/mutation/mutants.tsx. Per criterion, a FAMILY of mutants (good→fault flavours) + benign variants; verify must KILL every mutant + leave benign green. Mutation score per criterion = robustness (catches the CLASS, not the example). A surviving mutant = a HOLE. AVP is uniquely suited: the benchmark already IS the oracle, verify IS the runner. Each factory returns a render THUNK `()=><Screen/>` (gotcha: returning the component fn directly → "invalid hook call").

LOOP PROVEN: first run found persona·no-cross-persona-affordance killed the leak as a <button> but SURVIVED as <link>/<tab> (1/3). Hardened personaProbe → isAffordancePresent matches the foreign affordance by accessible name across INTERACTIVE_ROLES (button/link/tab/menuitem/option), not just the declared role → 3/3. mutate→find hole→harden→green.

Score now 8/8 (action-effect 3, data-honesty 2, persona 3), no false alarms. Suite 47/47.

LAYER 2 (RECOMMENDED, off-the-shelf): StrykerJS over src/ (does the bench pin the probes?) — config in docs/mutation.md. Backend → Stryker.NET over Assay.NET slices; target the BE archetypes (authz/webhook/notify) with backend mutants.

Boundary: Layer 1 = criterion robustness; Layer 2 = library robustness; neither proves completeness (stays convergent via escape accrual, now adversarial).
