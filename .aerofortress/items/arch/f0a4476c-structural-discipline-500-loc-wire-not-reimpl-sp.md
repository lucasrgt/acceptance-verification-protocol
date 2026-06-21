---
id: f0a4476c-9df1-4677-a96b-a68336f61de0
slug: arch
type: decision
title: Structural discipline (≤500 LOC, wire-not-reimpl, split-by-concern) + snowball guard
tags: arch, conventions, discipline, loc-cap, guard, modules, wire, lazuli-lang
provenance: observado
evidence: docs/CONVENTIONS.md; bench/source-size.test.ts; absorbed from lazuli-lang CLAUDE.md (dev/_acervo/lazuli-lang); suite 65/65
decay: stable
created: 2026-06-20T15:37:38.278119600+00:00
updated: 2026-06-20T15:37:38.278119600+00:00
validated: 2026-06-20T15:37:38.278119600+00:00
links: 
---

User: absorb lazuli-lang's harness discipline (module split, files ≤500 LOC) into AVP/Assay NOW so the protocol doesn't snowball. Cloned github.com/lazuli-lang/lazuli (shallow, dev/_acervo/lazuli-lang, not committed).

ABSORBED (docs/CONVENTIONS.md):
1. Abstraction is WIRE — adapters are thin glue over the substrate (RTL/MSW/TanStack/node:http), never reimplement what a mature lib does (their founding principle = our ponytail rung). Self-test: >100 LOC + zero substrate imports + lib exists → wrong.
2. Every source file ≤ 500 LOC (production AND test, no exceptions). Past ~300 after pulling helpers → SPLIT by concern.
3. One concern per file; index.ts barrels are re-exporters, not kitchen sinks.
4. Splits are additive — never break a public path (barrel re-export).
5. Repros faithful + co-located by concern, never numeric chunks; never shape to trip.
6. Honest skip over silent pass.

ENFORCED (red, not hope): bench/source-size.test.ts = the SNOWBALL GUARD, walks src/bench/tools/eslint-plugin-assay/example, fails if any .ts/.tsx/.cjs/.mjs > 500 LOC. Current state already lean: max file 204 LOC (bench/mutation/mutants.tsx), 0 over. Joins the guard family: protocol-sync (protocol can't lag), mutation (robustness), per-archetype benchmarks.

Loop assay-cycle invariants updated with the structural discipline. Suite 65/65, tsc clean. lazuli-lang also uses: grade-before-commit rubric (≥8.5), strict namespace (@runtime commodity vs @plugin named-product), scope-discipline 80/20 — noted as future ideas, not adopted yet.
