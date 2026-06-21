# Assay

> **The reference JS/React implementation of AVP — the Acceptance Verification Protocol.**
> Deterministic behavior verification for AI-built web features: a peripheral venous access to
> your system — tap the vein and confirm it's remediated.

**AVP** is the protocol (the language-neutral concepts — `subject`, `criterion`, `oracle`,
`condition`, `verdict`). **Assay** is this package: the first, reference implementation, for the
web (TypeScript + React). A future sibling will implement AVP for .NET. See [CONTEXT.md](CONTEXT.md)
for the protocol vocabulary and [docs/adr/0001-thin-layer-not-a-framework.md](docs/adr/0001-thin-layer-not-a-framework.md)
for why this stays thin.

## The problem

LLMs are great at trying until something works — but **only where a verifier exists**. Math has
a built-in judge (the proof closes or it doesn't); *"is this screen done?"* has none. Without a
verifier, vibe coding produces the classic **"looks done, isn't wired"**: the button renders but
is a no-op, the message disappears but the request failed, the list never refreshes. Assay
**manufactures the verifier**: it turns *"is the feature done?"* (subjective) into *"did the
criteria pass?"* (checkable).

Determinism lives in the **verifier**, not in the screen. The UI can be non-deterministic and
agent-generated; if the oracle is stable, the pass/fail is stable.

## Where it fits

Assay is the **behavior doctor** — the runtime sibling of the AeroFortress Framework static doctor (a convention linter
enforces *shape*; Assay enforces *observable runtime effect*). It is not a framework that wraps
your app: it's a thin layer **on top of mature substrate** (Vitest · Testing Library · MSW ·
axe-core · an LLM judge). You rewrite nothing — you declare the seams that already exist and Assay
drives the action, forces the condition, and observes the effect.

- **For humans:** an acceptance framework that emits a report.
- **For agents:** an *actionable* red/green signal that feeds the loop — generate-verify-converge
  instead of generate-and-hope.

## Model (formal vocabulary — see [CONTEXT.md](CONTEXT.md))

`subject` (feature/flow) ⟶ `specification` (a set of `criterion`) ⟶ each criterion forces a
`condition` and is decided by an `oracle` (`mechanical` / `model` / `human`) ⟶ a per-criterion
`verdict` + an aggregate `acceptanceScore`.

## Architecture

- **L0 Substrate** (not built): Vitest, Testing Library, MSW, axe-core, an LLM judge.
- **L1 Core** (`src/core`, framework-neutral): types, oracle router, aggregator — this is the
  AVP protocol made concrete.
- **L2 Adapter** (`src/adapter-react`): mount / inject condition / observe. React first.
- **L3 Verdict**: pass/fail + evidence + score, consumable by a human, CI, or an agent loop.

The **AVP protocol** (specification format, adapter contract, verdict format) will be **extracted
from two real implementations** (this one + the future .NET one), not designed top-down — the
LSP/SARIF lesson. That's why there is no `spec/` folder yet: the protocol is act two.

No `assay.config.ts`, no runner, no plugin system — Assay is a library you import and call. The
only knobs (an LLM judge model, a CI threshold) are arguments and env vars, never a config file.

## Authoring (Vitest-like, AVP vocabulary)

Specs read like a test file — `archetype` ≈ `describe`, `criterion` ≈ `it` — but in AVP's own
vocabulary. The declarative block emits the serializable spec (what travels) and the executable
oracles; archetypes stay framework-neutral via the `probe` the adapter injects.

```ts
import { archetype, criterion, mechanical } from 'assay';

export const actionEffect = archetype('action-effect', '0.1.0', () => {
  criterion(
    'fires-primary-effect',
    'The action fires its primary effect; no visible action is a no-op.',
    { under: 'success', seenIn: ['615ed1a7'] },
    mechanical(async ({ act, expect }) => {
      await act();
      expect.effectFired();
    }),
  );
});
```

Run it with the executor inside your existing runner — `verify(actionEffect, subject)` — no new
test runner. Oracle kinds: `mechanical(fn)` (deterministic), `model(rubric)` (LLM-as-judge),
`human(note)` (queued).

Or skip the test boilerplate: `defineVerification(actionEffect, subject)` (Vitest glue) declares a
run with no `describe/it`, and **`assay verify`** runs your verifications and prints verdicts — a
thin wrapper over your runner (ADR 0001), not a runner of its own. A `model` criterion is `skipped`
unless you pass a `{ judge }`.

## Slice 1 (what already runs)

The [`action-effect`](src/archetypes/action-effect.ts) archetype, 2 mechanical oracles, against a
**benchmark of real escapes** mined from a real-world tourism project (`bench/`): `(pre-fix,
post-fix)` pairs where the verifier must **fail the bad one and pass the good one**. This measures
the accuracy of the ruler itself — because scoring an agent with an uncalibrated ruler is fooling
yourself. See [`examples/todo-app`](examples/todo-app) for Assay verifying a real full-stack app.

```bash
npm install
npm test       # runs the verifier-accuracy benchmark
```

## Science, not just a tool

Two **measurable** claims are baked in: the criteria set **converges** from failures (escape
accrual), and the archetype template **transfers** across projects. Long-term goal: a
SWE-bench-style benchmark for web-feature acceptance. A tool earns GitHub stars; a benchmark
earns citations.

## License

MIT (TBD).
