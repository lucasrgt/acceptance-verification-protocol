---
id: 73a659c4-065d-4e27-aed4-9fe3bd517f0d
slug: specs
type: doc
title: Dogfood state: example (runtime) + eslint-plugin-assay (static) + real-app scan
tags: dogfood, criterion-3, eslint-plugin-assay, doctor, coverage, lazuli
provenance: observado
evidence: eslint-plugin-assay/; examples/todo-app/assay/; scan over the marketplace/project P/project F; commits 71117d7, a7ed505, df66c92
decay: seasonal
created: 2026-06-20T04:51:33.209346600+00:00
updated: 2026-06-20T04:51:33.209346600+00:00
validated: 2026-06-20T04:51:33.209346600+00:00
links: 
---

Criterion 3 (dogfood) state.

#1 RUNTIME (examples/todo-app): defineVerification generalized to any subject; the example now verifies TWO archetypes against the real TodoApp — action-effect (fires-primary-effect, no-phantom-success) + data-honesty (no-fixture-fallback, empty API → empty state). Example suite 2/2 green.

#2 STATIC (eslint-plugin-assay/): generic, framework-neutral ESLint plugin — rule `assay/require-verification` keys off Assay's convention (co-located *.assay.* calling defineVerification(<archetypeId>)). Tested without an eslint runtime (fs core vs temp fixtures, all green). scan.cjs = read-only coverage scan. ADR-0001-honest: claims only "did you check?", never "passes" (runtime) or "complete" (escape accrual). This is spec option 1.

REAL-APP DOGFOOD (read-only, non-invasive): scan over 3 real Lazuli apps — marketplace 80 views, project P 86, project F 23 = 189 *.view.tsx, 0 covered today. The exact gap the rule lights up. Proves the rule works against real code without mutating it.

#3 RUNTIME-IN-APP (held): mounting a real app screen and running verify() needs Assay wired into a shared product repo's test harness (vitest alias + deps + provider scaffolding) + a push to a shared repo. Deliberate next step, not an overnight push. Enable snippet for the lazuli doctor documented in docs/doctor-coverage.md.

ALL GREEN end-to-end: lib 24/24 (4 archetypes, detection 9/9, false-alarm 0), example 2/2, plugin self-test green, tsc clean.
