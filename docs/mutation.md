# Mutation testing — hardening the verifier

> Numbers in this document are a snapshot (measured 2026-06; the mutation bench re-runs on every `npx vitest run`).

The benchmark asks "does the verifier catch the one bug I showed it?" Mutation
testing asks the harder question: **"does the criterion catch the whole failure
CLASS, or just that one example?"** A criterion that passes the benchmark but
misses a sibling mutation is brittle — and brittle verifiers give false green,
the one catastrophic error. So we deliberately fail the criteria, in many flavours,
until they're robust.

There are two layers, answering two different questions.

## Layer 1 — mutate the *subjects* (archetype-aware, AVP-native) ✅ built

`bench/mutation.test.ts` + `bench/mutation/mutants.tsx`.

For each criterion we generate a **family of mutants** — distinct ways its failure
class can manifest — and require the criterion to KILL every one while leaving the
healthy variant green. AVP is uniquely suited to this: the benchmark already gives
us the oracle (good = should pass, mutant = should fail), and `verify` is the
runner. Each hand-authored `bad` repro was one mutant; this scales it to N.

The **mutation score** per criterion is its robustness: 100% = it catches the
class, not the example. A **surviving mutant is a hole** — exactly what hardens the
catalog.

This already paid off. The first run surfaced a real hole: `persona ·
no-cross-persona-affordance` killed the leak rendered as a `button` but **survived**
it rendered as a `link` or a `tab` (score 1/3). The fix hardened the probe to match
a foreign affordance by accessible name across every interactive role
(button/link/tab/menuitem/option), not just the one role the subject declared —
back to 3/3. Loop: mutate → find the hole → harden → re-run green.

Current score: **8/8 mutants killed**, no false alarms, across action-effect,
data-honesty and persona-scoped-visibility.

### Adding mutants

1. Add a fault flavour to the relevant family in `bench/mutation/mutants.tsx`
   (each factory returns a render thunk `() => <Screen/>`).
2. List it under the criterion's `killed` (must fail) or `benign` (must stay green)
   in `bench/mutation.test.ts`.
3. Run. A survivor is a finding — harden the probe (in `src/adapter-react/*`) until
   it's killed, like the persona case.

This is the loop to run "until it's robust": keep inventing flavours; every one a
criterion can't kill is a real gap closed.

## Layer 2 — mutate the *verifier's own code* (off-the-shelf Stryker) — recommended

Layer 1 hardens the *criteria*. Layer 2 hardens the *library*: if I break a probe's
code, does a benchmark test fail? That's standard mutation testing of `src/`, and
**StrykerJS** does it off the shelf.

```
npm i -D @stryker-mutator/core @stryker-mutator/vitest-runner
```

```jsonc
// stryker.conf.json
{
  "testRunner": "vitest",
  "mutate": ["src/**/*.ts", "src/**/*.tsx", "!src/**/index.ts"],
  "reporters": ["clear-text", "html"],
  "coverageAnalysis": "perTest"
}
```

`npx stryker run` → a mutation score for the probes/core against the bench. A low
score on a probe means the bench doesn't pin it — add a benchmark case. (Heavier +
slower than Layer 1; run it periodically, not on every change.)

**Backend (Assay.NET, future):** the same discipline with **Stryker.NET**
(`dotnet stryker`) over the backend slices/criteria. The catalog's BE archetypes
(authorization, integration-integrity, second-order-effects) are exactly the
classes a backend mutation set should target — call as the wrong actor, forge the
webhook signature, drop the notification — and require the BE criteria to kill them.

## The honest boundary

Layer 1 measures **criterion robustness** (does the catalog catch the class). Layer
2 measures **library robustness** (is the code pinned by tests). Neither proves
**completeness** — there is always a mutation you didn't think of. Completeness
stays convergent (escape accrual), never proven; mutation testing just makes the
convergence adversarial instead of waiting for production to find the next flavour.
