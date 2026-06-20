# Coverage rule — enforcing that features actually have verifications

Assay verifies behavior at **runtime**, but only for features that *have* a verification. The
static gap — "you never wrote a verification" or "you didn't run the archetype this feature
needs" — must be caught upstream, by a **static doctor**. Assay stays runtime-only (ADR 0001);
this rule plugs the coverage check into an existing static doctor (in a lazuli-net project, its
ESLint/LZFE layer).

## The honest boundary

- **Forceable (static):** a feature has a co-located Assay verification that runs the
  archetype(s) its type requires. → *"Did you check?"*
- **Not forceable here:** that the verification *passes* (runtime → Assay), or that the
  archetype's criteria are *complete* (convergent → escape accrual). → *"Is the check complete?"*

"Did you check?" is enforceable; "is the check complete?" is not. The rule only claims the first.

## The convention the rule keys off

- Verification files: `*.assay.ts` / `*.assay.tsx`, co-located with the feature/view.
- Top-level call: `defineVerification(<archetype>, <subject>, <opts?>)`.
- A feature **covers archetype A** iff a co-located verification calls `defineVerification(A, …)`.

This is the stable contract Assay offers the doctor — it is plain, statically matchable source.

## Rule: `assay/require-verification`

Static (ESLint). Config maps a file/view selector → the archetypes that type must cover:

```jsonc
{
  "rules": {
    "assay/require-verification": ["error", {
      "coverage": [
        { "files": "src/**/*.view.tsx", "archetypes": ["action-effect"] },
        { "files": "src/**/checkout/**", "archetypes": ["action-effect", "payment"] }
      ]
    }]
  }
}
```

For each file matching `files`, require a co-located `*.assay.*` that calls `defineVerification`
with each listed archetype. Missing → report on the feature file.

### Examples

- **bad** — `src/checkout/Pay.view.tsx` exists, no `Pay.assay.tsx`
  → `checkout view has no Assay verification for: payment`.
- **good** — `Pay.assay.tsx` with `defineVerification(payment, paySubject)` → passes.

## Implementation options

1. **Assay ships a generic `eslint-plugin-assay`** with `require-verification`; the lazuli-net
   doctor *enables + configures* it (maps lazuli slice/view types → archetypes). Reusable by any
   ecosystem — matches "AVP is for everyone". **← recommended.**
2. lazuli authors a bespoke LZFE rule (e.g. `LZFE0NN`) with the same semantics. Tighter lazuli
   idiom, but not reusable outside lazuli.

## Where it runs

The lazuli `doctor` already runs ESLint (LZFE) in dev + CI. This rule rides that — no new runner,
no new doctor. The static coverage check (doctor) + runtime correctness (Assay `verify`) +
existing shape rules (LZFE loading/error/empty) together give a lazuli app its full completeness
story: *present → covered → correct*.

## Status — built (option 1) + dogfooded read-only

`eslint-plugin-assay` exists (`eslint-plugin-assay/`, option 1): the generic
`require-verification` rule + a no-framework self-test (green) + a read-only
`scan.cjs`. The scan, run against three real Lazuli apps WITHOUT touching them,
measured the coverage gap they'd have the day they adopt the rule:

| app | `*.view.tsx` features | covered today | gap |
|---|---|---|---|
| marketplace | 80 | 0 | 80 |
| project P | 86 | 0 | 86 |
| project F | 23 | 0 | 23 |

189 real view-features, 0 currently carrying an Assay verification — the exact
surface the rule would light up. Enabling it inside the lazuli doctor (the
`assay/require-verification` config keyed to lazuli's `*.view.tsx` slice type) is
the remaining one-line wiring; it lives in the shared framework repo, so it ships
deliberately, not as an overnight push.
