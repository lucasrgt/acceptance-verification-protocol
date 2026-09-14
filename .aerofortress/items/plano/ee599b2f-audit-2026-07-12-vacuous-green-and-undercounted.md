---
id: ee599b2f-0bb1-4cd5-86bb-2ad314600cb5
slug: plano
type: fact
title: Audit 2026-07-12: vacuous green and undercounted scientific measurement
tags: audit, core-science, false-green, measurement
provenance: observado
evidence: assay/src/core/verdict.ts:18; assay/src/adapter-react/vitest.ts:42-47; assay/tools/measure/measure.mjs:9-40; docs/measurements.md:10; observed commands 2026-07-12: 247 JS tests passed, 2 pending, 51 .NET tests passed
decay: seasonal
created: 2026-07-12T05:06:58.820380400+00:00
updated: 2026-07-12T05:06:58.820380400+00:00
validated: 2026-07-12T05:06:58.820380400+00:00
links: 
---

A read-only audit found two priority gaps. (1) The protocol computes `acceptanceScore = 1` when `applicable === 0`, while `defineVerification` gates only on that score; therefore a run where every criterion is skipped passes the default Vitest gate. The formatted output admits “nothing was decided”, but the automated gate is still green. (2) The scientific convergence table reports 66 criteria but only 6 executed pairs because `measure.mjs` records only tests using the shared `pairAccuracy` harness; only 2 of 59 benchmark files use it, while many calibrated tests emit console numbers manually. The versioned table has a single historical row, so it is not yet a convergence curve. Recommended priority: make zero-applicable inconclusive/failing by default, then unify all calibration datapoints into one machine-readable reporter and gate documentation/claims on it.
