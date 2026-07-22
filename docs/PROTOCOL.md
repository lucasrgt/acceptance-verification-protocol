# AVP — the Acceptance Verification Protocol (v0.4)

> **AVP is the protocol; Assay is one implementation of it.** This document is the
> language-neutral contract another implementation (Assay.NET, a Rails adapter, a
> Go adapter) verifies against. Per ADR 0001 the protocol is *extracted* from real
> implementations, not designed top-down — v0.1 is extracted from what is proven
> across **five substrates** sharing one core: the behaviour tier (`dom` + `http`)
> and the design tier (`style` on jsdom, `geometry` on a headless browser, `model`
> on an LLM judge). The .NET extraction refined it and, since the authority handover
> (2026-07-02), **leads it**: the artifact is emitted from the .NET source and both
> implementations are guarded against it (see "Staying in lockstep").

## The shape

```
Subject ──(adapter)──► observation ──(criterion's oracle)──► CriterionVerdict
            │                                                      │
        a Specification (archetype + criteria)              aggregated ► Verdict { outcome, acceptanceScore }
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
- **CriterionVerdict** =
  `{ criterionId, status: pass|fail|not-applicable|unresolved, reason, evidence? }`.
  - `not-applicable` means the invariant genuinely does not belong to this subject.
  - `unresolved` means the invariant belongs to the run but its oracle could not decide it.
- **Verdict** = `{ subject, archetype, results[], outcome, acceptanceScore }` where
  `acceptanceScore = passed / applicable` and `applicable = pass + fail`. The score is
  `null` when nothing was applicable. `outcome` is `fail` if any criterion failed;
  otherwise it is `inconclusive` if any criterion is unresolved or nothing was
  applicable; otherwise it is `pass`.

A **Subject** descriptor is adapter-specific (the DOM adapter declares how to
mount + which control; the HTTP adapter declares the request) — it is the one part
that is *not* portable by design: each substrate names its own seams.

## Execution model (the adapter contract)

The core runner is substrate-neutral. An implementation provides **hooks**:

```
runVerification(subjectName, archetype, hooks) -> Verdict

hooks = {
  probe(condition) -> Probe          // build the observation for a mechanical criterion
  applies?(criterion) -> notApplicableReason? // domain applicability gate
  gatherEvidence?(condition) -> any  // evidence for a model criterion
  judge?                             // decides model criteria; absent => unresolved
}

Probe = { act(): Promise<void>; expect: E }   // E = the archetype's assertion vocabulary
```

The runner loops the criteria: mechanical → build probe, run the body, pass/fail on
`AvpFail`; model → gather evidence, ask the judge (or mark unresolved); human →
unresolved until a decision is supplied.
The DOM and HTTP adapters both implement exactly this — that two substrates run
through one runner is the proof the core is not framework-shaped.

**Error semantics (normative — where implementations must agree):**

- An oracle failing with the implementation's fail signal (`AvpFail` / `AvpFailException`)
  → a `fail` verdict carrying the actionable reason + evidence.
- An oracle raising `AvpNotApplicableException` in .NET, or `applies()` returning a
  reason in JS, → `not-applicable`. This is only for a domain invariant that genuinely
  does not belong to the subject; it is never a pass.
- An oracle raising `AvpUnresolvedException`, or a missing model/human oracle, →
  `unresolved`. The aggregate is inconclusive and every conforming gate fails closed.
- An **unexpected** error (infrastructure, a bug in the probe) → still a `fail` verdict,
  with the error message/stack as evidence. A run ALWAYS ends in a Verdict; aborting the
  run on an oracle error is non-conformant.
- Caller-initiated cancellation is the one thing that may abandon a run without a Verdict.

## The catalog

The archetypes + criteria are the contribution (the dictionary). Forms:

- **`protocol/catalog.json`** — the BEHAVIOUR catalog (the `dom`/`http` archetypes),
  machine-readable, the portable source. Emitted from the .NET-led source
  (`assay.net/src/Assay.Net/CatalogSource.cs`); any implementation reads it to know
  what to cover.
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
4. distinguishes genuine `not-applicable` from unavailable evidence/oracles as
   `unresolved`; an unresolved or empty run is inconclusive and fails closed (a false
   green is the catastrophic error).

The `substrate` axis decides who covers what: `dom` archetypes → a frontend adapter; `http`
archetypes (authorization, integration-integrity, second-order-effects) → an HTTP or
in-process backend adapter; `static` → the host's linter/doctor; and the design substrates →
a design adapter — `style` on jsdom (computed style), `geometry` on a headless browser, `model`
on an injected LLM judge. The roles since the authority handover: **Assay.Net** emits the
catalog and is the backend (`http`) adapter; **Assay (JS)** is the conformant FRONT adapter —
the executor of `dom` and the three design substrates, guarded against the committed artifact
by `bench/protocol-sync.test.ts`. The design tier's `geometry` probes share one loader
(`adapter-design/surface.ts`) and can drive either a synthetic React surface or a live app URL.

## Staying in lockstep (why the protocol can't fall behind)

The catalogs are **emitted from the .NET source**
(`assay.net/src/Assay.Net/CatalogSource.cs` — the authority since the 2026-07-02
handover), and two guards hold the lockstep from both sides:

- **.NET, the emitter** — `CatalogSyncTests` asserts the committed artifact equals the
  canonical emission byte for byte, and that the data model round-trips it losslessly.
  Change the source without regenerating and the suite goes **red**.
- **JS, the mirror** — `bench/protocol-sync.test.ts` asserts the shipped JS archetypes
  build the SAME content as the committed artifact. The JS side has **no write path**.

So the protocol is structurally incapable of diverging from either implementation.
To evolve the contract: edit `CatalogSource.cs`, regenerate with
`ASSAY_WRITE_PROTOCOL=1 dotnet test --filter CatalogSync` (from `assay.net/`), then
bring the JS archetypes into lockstep.

## Versioning

`protocolVersion` (currently `0.4.0`) bumps when the data model or the condition/
oracle/substrate vocabularies change; archetype `version`s bump independently as their
criteria evolve. v0.1 was the first extraction (5 substrates, 1 language); the
Assay.NET extraction refined the model into its cross-language form (0.2.0) and the
catalog is now emitted from the .NET side — the contract's final custody. v0.4 split
non-applicability from missing proof and made the empty/unresolved aggregate inconclusive.
