---
id: f77c79cf-3fa6-4814-99ab-2850b7bbde81
slug: arch
type: decision
title: Decision: all starter projects (`af new`) born with native gate integration
tags: scaffold, gate, ci, convention
provenance: dito
evidence: CONVENTIONS.md section update; framework 2.1.4 starter template; pauta-web CI configuration; pilot retrofit commits
decay: stable
created: 2026-07-02T15:36:58.005087400+00:00
updated: 2026-07-02T15:36:58.005087400+00:00
validated: 2026-07-02T15:36:58.005087400+00:00
links: 
---

**Pattern**: starter template now includes gate infrastructure by default—`.github/workflows/ci.yml` running `af gate`, `lefthook.yml` pre-commit hooks, `package.json` with `prepare` script. Every new project inherits continuous verification from day zero, not retrofitted.

**Why**: Prevents the escape where agente creates a new project, develops locally, commits untested code, and no gate catches it because verification infrastructure doesn't exist in a fresh scaffold. Concrete example: APT/ASI, born without gate, agente committed without running suite.

**How to apply**: Documented in CONVENTIONS.md section 'The gate travels with the scaffold — born gated, like slices and modules.' Template now bakes in `.aerofortress/` conventions, pre-commit enforcement, and CI workflow. Every `af new <name>` generates a gated project. Framework 2.1.4+; all recent pilots retrofit to this pattern.
