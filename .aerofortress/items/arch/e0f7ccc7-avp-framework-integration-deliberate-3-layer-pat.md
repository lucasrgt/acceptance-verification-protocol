---
id: e0f7ccc7-c769-449e-a7c3-a6895415aa90
slug: arch
type: decision
title: AVP framework integration — deliberate 3-layer pattern, not coupling
tags: integration, architecture, aerofortress-framework, doctor
provenance: dito
evidence: 
decay: stable
created: 2026-07-02T14:54:17.505712600+00:00
updated: 2026-07-02T14:54:17.505712600+00:00
validated: 2026-07-02T14:54:17.505712600+00:00
links: 
---

AVP integrates into aerofortress-framework across three execution-context-aware layers by design: (1) **compile-time doctor** (Roslyn AF0030/AF0031) validates form—every criterion in spec.toml must have co-located [AVP] proof, no I/O allowed; (2) **runtime proofs** ([AVP]-marked xUnit facts in test host with full context: compiled app, real DB, DI); (3) **CI orchestration** (`af gate` command runs doctor leg + proof leg in-process using Assay.Net binary, crosses declarations × proofs × verdicts in traceability matrix, single exit code). Separation respects structural constraints of each context (compiler I/O restrictions, test host availability, CI process boundaries)—it is what enables AVP to be both build-enforceable and fully executable. Missing piece was CI *obligation*; now `af gate` runs automatically on all pilots (framework 2.1.4+, CLI 0.2.1+).
