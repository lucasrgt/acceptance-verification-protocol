# AVP Engineering Guide

All repository artifacts must be written in English.

## Engineering constitution

1. The JavaScript runtime under `assay/src/` must retain at least 95 percent
   line coverage without rounding.
2. The .NET runtime under `assay.net/src/` must retain at least 95 percent
   line coverage without rounding.
3. Maintained production code must remain within the 7,000-line repository
   budget and each production source file must remain at or below 500 LOC.
4. Test code is unlimited. Production behavior may not be moved into tests,
   generated artifacts, benchmarks, or harness scripts to evade a gate.
5. Every public criterion remains escape-grounded and calibrated with a
   vulnerable and corrected pair.
6. Missing evidence, missing infrastructure, and unresolved criteria fail
   closed.

The 7,000-line budget covers both reference implementations, their public CLI,
and the ESLint integration. A deliberate protocol expansion may revise that
budget in the same reviewed change, but silent growth is forbidden.

## Canonical verification

Before reporting implementation work complete, run:

```bash
cd assay
npm run verify
```

This is the canonical local, CI, and release gate. It owns typechecking, lint,
the production line budgets, the complete JavaScript suite with coverage, the
portable scientific measurement, package entrypoint smoke tests, the ESLint
plugin self-test, the CLI example, and the complete .NET suite with coverage.

Do not substitute a partial test command for `npm run verify`.
