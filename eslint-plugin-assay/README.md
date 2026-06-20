# eslint-plugin-assay

The **static** half of Assay's determinism story: catch *"this feature has no
verification"* before runtime. Assay (`verify`) proves behaviour is correct at
runtime; this rule proves a verification *exists* to be run. Together with a
project's existing shape rules (loading/error/empty), they give the full
completeness story: **present → covered → correct**.

Assay stays runtime-only by design (ADR 0001); coverage is a static concern, so it
lives here, in your lint step.

## Rule: `assay/require-verification`

For each file matching a `files` glob, require a co-located `*.assay.*` that calls
`defineVerification(<archetype>, …)` for each listed archetype. The `archetypes`
you configure are the **archetype binding identifiers** as imported (e.g.
`actionEffect`, `dataHonesty`), matched against the first argument of each
`defineVerification` call.

```js
// eslint.config.js (flat config)
const assay = require("eslint-plugin-assay");

module.exports = [
  {
    files: ["src/**/*.view.tsx"],
    plugins: { assay },
    rules: {
      "assay/require-verification": ["error", {
        coverage: [
          { files: "src/**/*.view.tsx", archetypes: ["actionEffect"] },
          { files: "src/**/checkout/**", archetypes: ["actionEffect", "payment"] },
        ],
      }],
    },
  },
];
```

A lazuli-net app enables it from its doctor and maps its slice/view types to
archetypes — the rule itself is framework-neutral (matches "AVP is for everyone").

## Read-only coverage scan

Measure the gap a project would have *today*, without changing anything:

```
node node_modules/eslint-plugin-assay/scan.cjs <project-dir> [suffix=.view.tsx]
```

It walks for `*.view.tsx` features and reports how many have a co-located Assay
verification — the dogfood number.

## What it claims

Only *"did you check?"*. Not *"does the check pass?"* (runtime → Assay `verify`) and
not *"is the check complete?"* (convergent → escape accrual). Honest boundary by
design.
