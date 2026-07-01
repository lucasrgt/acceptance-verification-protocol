# AVP — the Acceptance Verification Protocol (v0.1)

> **AVP is the protocol; Assay is one implementation of it.** This document is the
> language-neutral contract another implementation (Assay.NET, a Rails adapter, a
> Go adapter) verifies against. Per ADR 0001 the protocol is *extracted* from real
> implementations, not designed top-down — v0.1 is extracted from what is proven
> across **five substrates** sharing one core: the behaviour tier (`dom` + `http`)
> and the design tier (`style` on jsdom, `geometry` on a headless browser, `model`
> on an LLM judge). The .NET extraction will refine it; until then this artifact
> LEADS the lib, it does not lag it (see "Staying in lockstep").

## The shape

```
Subject ──(adapter)──► observation ──(criterion's oracle)──► CriterionVerdict
            │                                                      │
        a Specification (archetype + criteria)              aggregated ► Verdict { acceptanceScore }
```

A **Subject** (a feature/flow) is verified against a **Specification** (an
archetype's criteria). Each criterion forces a **Condition**, is decided by an
**Oracle**, and yields a **CriterionVerdict**; the aggregate is a **Verdict** with
an `acceptanceScore`.

## Data model (portable)

- **Specification** = `{ archetype, version, criteria[] }`.
- **Criterion** = `{ id, statement, oracle, scope, condition, substrate?, seenIn? }`.
  - `id` — stable protocol identifier (e.g. `own-resource-only`).
  - `statement` — the invariant in plain language (written for the agent to fix).
  - `oracle` — `mechanical | model | human` (see Oracle kinds).
  - `scope` — `invariant | example` (criteria are invariants, not example checks).
  - `condition` — `{ id }` from the condition vocabulary.
  - `substrate` — the engine that can DECIDE it (see Substrate axis); omitted on the
    original DOM/HTTP behaviour archetypes, declared on the design archetypes.
  - `seenIn` — empirical evidence: refs where the absence caused an escape.
- **Condition vocabulary**, three axes (the precondition an adapter must force):
  - fault: `success | api-error | slow | offline`
  - data: `empty | partial`
  - interaction/recovery: `retry | double-activate | token-expired`
  - Custom ids beyond this vocabulary are legal for OFF-CATALOG criteria (ADR 0002) —
    the adapter that binds them must know how to force them.
- **Oracle kinds**: `mechanical` (deterministic), `model` (LLM-as-judge,
  injectable), `human` (queued).
- **Substrate axis** — the *layered-determinism* axis: the cheapest engine that can decide a
  criterion (the determinism lives in the verifier, not the screen). An implementation covers
  a substrate by binding hooks to it.
  - `static` — decided without running the app (the host's linter/doctor).
  - `dom` — DOM events + the rendered tree (a React/DOM adapter).
  - `http` — requests/responses (an HTTP or in-process backend adapter).
  - `style` — the resolved computed style, no layout engine (jsdom): tokens, theme, type
    hierarchy, declared spacing, contrast.
  - `geometry` — the real layout (a headless browser): overflow, overlap, responsive,
    reading order, RTL mirroring, hit-area, layout shift.
  - `model` — an LLM-as-judge for a semantic call no mechanism can make (icon meaning-fit).
- **CriterionVerdict** = `{ criterionId, status: pass|fail|skipped, reason, evidence? }`.
- **Verdict** = `{ subject, archetype, results[], acceptanceScore }` where
  `acceptanceScore = passed / applicable` (skipped excluded).

A **Subject** descriptor is adapter-specific (the DOM adapter declares how to
mount + which control; the HTTP adapter declares the request) — it is the one part
that is *not* portable by design: each substrate names its own seams.

## Execution model (the adapter contract)

The core runner is substrate-neutral. An implementation provides **hooks**:

```
runVerification(subjectName, archetype, hooks) -> Verdict

hooks = {
  probe(condition) -> Probe          // build the observation for a mechanical criterion
  applies?(criterion) -> skipReason? // applicability gate (else the criterion runs)
  gatherEvidence?(condition) -> any  // evidence for a model criterion
  judge?                             // decides model criteria; absent => skipped
}

Probe = { act(): Promise<void>; expect: E }   // E = the archetype's assertion vocabulary
```

The runner loops the criteria: mechanical → build probe, run the body, pass/fail on
`AvpFail`; model → gather evidence, ask the judge (or skip); human → skip (queued).
The DOM and HTTP adapters both implement exactly this — that two substrates run
through one runner is the proof the core is not framework-shaped.

## The catalog

The archetypes + criteria are the contribution (the dictionary). Forms:

- **`protocol/catalog.json`** — the BEHAVIOUR catalog (the `dom`/`http` archetypes),
  machine-readable, the portable source. Generated from the shipped archetypes; any
  implementation reads it to know what to cover.
- **`protocol/design-catalog.json`** — the DESIGN catalog: the same protocol, a sibling
  archetype catalog on the design substrates (`style`/`geometry`/`model`). Each criterion
  carries its `substrate`, so a design adapter in any language (Assay.NET, a Rails adapter)
  knows which engine to bind. Generated and drift-guarded exactly like the behaviour catalog.
- **`docs/catalog.md`** — the human dictionary (reach FE/BE/STATIC, oracle,
  ranked by frequency, source escapes). `docs/design-acceptance.md` is the design tier's
  dictionary; `docs/corpus-multistack.md` is the cross-stack evidence; `docs/transfer.md` is RQ4.

## Conformance

An implementation is AVP-conformant for a substrate if it:
1. consumes the Specifications in `protocol/catalog.json` and/or
   `protocol/design-catalog.json`;
2. provides `hooks` (probe/applies/…) binding the archetypes' criteria to that
   substrate, for every catalog archetype its substrate can observe;
3. emits `Verdict`s in the shape above (status + acceptanceScore);
4. is honest: a criterion whose oracle/seam is unavailable is `skipped`, never
   silently passed (a false green is the catastrophic error).

The `substrate` axis decides who covers what: `dom` archetypes → a frontend adapter; `http`
archetypes (authorization, integration-integrity, second-order-effects) → an HTTP or
in-process backend adapter; `static` → the host's linter/doctor; and the design substrates →
a design adapter — `style` on jsdom (computed style), `geometry` on a headless browser, `model`
on an injected LLM judge. Assay (this repo) is the reference implementation of `dom`, `http`,
and all three design substrates; the design tier's `geometry` probes share one loader
(`adapter-design/surface.ts`) and can drive either a synthetic React surface or a live app URL.

## Staying in lockstep (why the protocol can't fall behind)

`protocol/catalog.json` is **generated from the archetypes**, and
`bench/protocol-sync.test.ts` asserts the committed artifact equals the freshly
built one. Add a criterion to the lib without updating the protocol artifact and
the suite goes **red**. So the protocol is structurally incapable of lagging the
implementation by even one criterion — it is a derived source of truth, guarded.

Regenerate after any archetype/criterion change:
`ASSAY_WRITE_PROTOCOL=1 npx vitest run protocol-sync`.

## Versioning

`protocolVersion` (currently `0.1.0`) bumps when the data model or the condition/
oracle/substrate vocabularies change; archetype `version`s bump independently as their
criteria evolve. v0.1 is the first extraction (5 substrates, 1 language); the
Assay.NET extraction is expected to refine the Subject-descriptor and adapter
contract into their final cross-language form.
