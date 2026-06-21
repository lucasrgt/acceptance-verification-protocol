---
id: 84cdd421-5c85-4dfc-bb10-dc27b29a54c9
slug: design
type: fact
title: Design catalog · icon-correctness executed (the model-oracle criterion)
tags: assay-design, design-catalog, icon-correctness, model-oracle, claude-judge, stop-frontier
provenance: observado
evidence: src/archetypes/icon-correctness.ts, src/adapter-design/icon-correctness.ts, src/adapter-design/verify.ts (DesignOptions/judge), bench/icon-correctness.test.ts; full suite 47 files/195 tests green; grounding hashes verified in dev/_acervo/{gitea,mastodon}
decay: seasonal
created: 2026-06-20T21:04:37.170309800+00:00
updated: 2026-06-20T21:04:37.170309800+00:00
validated: 2026-06-20T21:04:37.170309800+00:00
links: 
---

11th design criterion — and the ONLY model-oracle one (the last non-mechanical design criterion).

**icon-correctness · icon-fits-meaning**: each icon's MEANING must fit its control's label
(Back→left-chevron/arrow, Forks→fork, Search→magnifier, Delete→trash). Distinct from
composition-canonical (which checks an icon is PRESENT and is the canonical DS component);
this checks the glyph means the right thing — a semantic call no mechanical check can make.

Oracle = `model(rubric)` (src/core/dsl.ts). The design adapter's `iconHooks` provides
`gatherEvidence()` — mounts via RTL, reads every `[data-icon]` + the accessible label of its
host control (`closest('button,a,[role=button],[data-control]')` → aria-label/text) → evidence
`{ icons: [{icon,label}] }` — and threads an injected `judge`. No mechanical probe (probe stub
throws; the core only calls probe for mechanical criteria). Without a judge → `skipped`
(honest coverage). `verifyDesign(archetype, subject, { judge })` gained an optional opts bag;
REGISTRY builders now take `(subject, opts)`; mechanical archetypes ignore opts.

Prod judge = `claudeJudge()` (src/judge/claude.ts, lazy @anthropic-ai/sdk, json_schema verdict,
fail-closed). The BENCH injects a deterministic rule-based stub judge (no network — same
pattern as bench/model-oracle.test.ts; the live Claude path is already covered by
bench/claude-judge.test.ts). The bench's real verification value: it proves the adapter
gathers ENOUGH evidence (icon + label) for ANY judge to catch each mismatch — if the gatherer
dropped the label, no judge could decide.

Grounded faithfully in real wrong-icon fixes (verifiable in dev/_acervo): gitea:edf0dfd1 "use
repo-forked icon to display forks count", gitea:3102c04c "issue close timeline icon",
mastodon:9576434d "outdated icon in notifications banner".

Results: detection 1/1, mutation 3/3 (trash-on-Back / file-on-Forks / bell-on-Search),
false-alarm 0, evidence-shape asserted, skipped-without-judge asserted. tsc clean, full suite
47 files / 195 tests green. Behaviour catalog untouched (39/39).

**Design catalog now: 11 criteria — jsdom (7) + browser (3) + model (1), 40/40 mutants killed,
false-alarm 0.** Substrate split complete: STATIC (host doctor) / jsdom (computed style) /
geometry (real browser) / model (LLM judge).

STOP ASSESSMENT: the grounded design criteria across all four substrates are now harvested —
token/theme/type/composition/state/contrast/spacing (jsdom), layout/layer/responsive
(geometry), icon (model). A mining+selection round over dev/_acervo turns up no further
high-value design criterion whose adapter exists that isn't already covered. The remaining
value is STRUCTURAL, not new-criterion: (1) formalise a DESIGN protocol surface — substrate
axis in CONDITION_AXES + docs/PROTOCOL.md + design archetypes in a portable catalog (logged
design-acceptance.md step 5); (2) Assay.NET. Both are explicitly beyond the loop's
"one new grounded criterion per iteration" mandate. Per the loop stop condition, the
new-criterion frontier is dry.
