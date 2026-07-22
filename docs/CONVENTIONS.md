# Conventions — keep the protocol from snowballing

Discipline adopted at the *start* of the protocol, so it can't rot later. Borrowed
from the AeroFortress Framework's working rules (a mature AI-first framework) and adapted to
AVP/Assay (TS). Where possible each rule is **enforced by a guard test**, not left
to memory — the same philosophy as the protocol drift guard: make it red, don't
make it a hope.

## 1. Abstraction is wire — ride the substrate, don't reimplement it

Assay's adapters are **thin glue** over the platform substrate, not homegrown
engines. The React adapter rides Vitest/RTL/MSW/TanStack Router; the HTTP adapter
rides `fetch` + `node:http`; the core rides nothing it can borrow. A probe/adapter
file is `arrange + observe`, not a framework.

Self-test before committing an adapter file: if it's >100 LOC with zero substrate
imports and it's re-doing something a mature library already does, it's wrong —
rewrite as wire or delete. (the AeroFortress Framework's founding principle; our ponytail rung.)

## 2. Every source file ≤ 500 LOC — production AND test, no exceptions

The ceiling. Past ~300 LOC, once the obvious helpers are pulled, that's the signal
to **split by concern**, not to keep packing. Enforced by
`bench/source-size.test.ts` (the snowball guard) across `src/`, `bench/`, `tools/`,
`eslint-plugin-assay/`, and the example.

The canonical split:

```
<concern>.ts                 # one file, ≤ 500 LOC, or →
<concern>/
  index.ts                   # thin barrel: re-exports + shared types only (NOT a kitchen sink)
  <sub-concern-a>.ts         # each sibling ≤ 500, named for the concern it owns
  <sub-concern-b>.ts
```

## 3. One concern per file; the barrel is a re-exporter

Each archetype is its own file in `src/archetypes/`; each adapter binds one
archetype's probe in `src/adapter-<substrate>/`. `index.ts` files are barrels —
they re-export, they don't accumulate logic. Adding an archetype = a new file + one
registry entry + one barrel line, never a god-file edit.

## 4. Splits are additive — never break a public path

When you split a file, keep every existing export resolving (re-export from the new
location via the barrel). The public surface (`src/index.ts`, `src/adapter-*/index.ts`)
only grows; downstream consumers (the protocol catalog, benches, the example) keep
importing the same paths.

## 5. Repros are faithful and co-located by concern, never numeric chunks

A benchmark repro reproduces the real diff (good/bad) and lives next to its
archetype's bench. Split bench files by sub-concern (e.g. `navigation-nested`,
`navigation-back`), never by line count. Never shape a repro to trip a criterion;
the GOOD must pass with no false alarm.

## 6. Non-applicable is not unresolved

A criterion that genuinely does not belong to a subject is `not-applicable`. A
criterion that belongs but lacks an oracle or evidence is `unresolved`, making the
aggregate inconclusive. Neither is silently passed, and an empty run is inconclusive.
A false green is the catastrophic error. (Carried in the runner + every host gate.)

## The guards that enforce this (red, not hope)

- `bench/source-size.test.ts` — ≤500 LOC per file.
- `bench/protocol-sync.test.ts` — `protocol/catalog.json` in lockstep with the
  shipped archetypes (the protocol can't lag the lib).
- good/bad calibration benches — every bound criterion must catch its vulnerable repro
  and accept its corrected one; mutation families deepen high-risk probes.
- the per-archetype benchmarks — BAD fails the target criterion, GOOD no false alarm.

Together they make the structural rules executable: the tree goes red the moment a
rule is violated, so the discipline survives every session and every contributor.
