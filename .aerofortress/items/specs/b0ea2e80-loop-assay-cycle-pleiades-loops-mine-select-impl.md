---
id: b0ea2e80-7052-44cd-b22c-91286e6a9b8f
slug: specs
type: doc
title: Loop assay-cycle (.pleiades/loops/) — mine→select→implement→harden→continue
tags: loop, cycle, miner, criteria, mutation, pleiades, automation
provenance: observado
evidence: .pleiades/loops/assay-cycle.md (proof-loop format: frontmatter description/stop/max + body)
decay: stable
created: 2026-06-20T15:27:03.739347200+00:00
updated: 2026-06-20T15:27:03.739347200+00:00
validated: 2026-06-20T15:27:03.739347200+00:00
links: 
---

`.pleiades/loops/assay-cycle.md` — the full Assay development cycle as a Pleiades loop (recursive, iteration-by-iteration until a stop condition). Format mirrors the proof plugin loops (frontmatter: description/stop/max + body with iteração-0 setup then per-iteration protocol).

THE CYCLE (one new criterion per iteration, chaos→green):
0. baseline green (vitest+tsc); recover state from network + docs/catalog.md status table; ensure dev/_acervo blobless clones.
1. MINE: tools/escape-miner/mine.cjs over the acervo → archetype distribution, find uncovered volume.
2. SELECT next criterion by value = corpus-frequency × not-yet-executed × adapter-available (FE→React adapter, BE→HTTP adapter over pure node; .NET deferred). Read the real source diffs (git show) for a faithful signal.
3. IMPLEMENT: faithful good/bad repro (bench/dataset) + criterion (src/archetypes) + probe (adapter) registered in verify + benchmark (BAD fails target, GOOD no false alarm). BE repro server = pure node:http, .ts.
4. HARDEN (loop-in-loop): add a mutant family (bench/mutation) → all mutants must die, benign green; survivor=hole→harden the probe to 100% mutation score.
5. GREEN+RECORD: tsc+vitest green; update catalog status/totals + corpus; persist to network; commit the green increment (English/neutral, foreign refs prefixed; avp has no remote→local commit).

INVARIANTS baked in: English/neutral repo; never shape a repro / loosen an assert; green per commit; honest executed-vs-cataloged; two-tier (classified corpus scales, executed benchmark curated). STOP: a mine+select pass finds no high-value uncovered criterion with an available adapter, or 2 iterations of only trivial/.NET-blocked work. Loops are opt-in per machine (run/enable from the Loops panel).
