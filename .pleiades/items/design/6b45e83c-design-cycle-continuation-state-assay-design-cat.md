---
id: 6b45e83c-5e36-4983-9ad1-423e626078b3
slug: design
type: project
title: Design-cycle CONTINUATION STATE — Assay Design catalog (jsdom tier done; Playwright geometry next)
tags: 
provenance: observado
evidence: remote origin/main tip 4ada8d6 (clean); full suite 173 tests green; design 6 criteria 24/24 mutants; behaviour 39/39
decay: stable
created: 2026-06-20T20:37:59.354094200+00:00
updated: 2026-06-20T20:37:59.354094200+00:00
validated: 2026-06-20T20:37:59.354094200+00:00
links: 
---

**Single pointer for resuming Assay Design after compaction.** The "assay-cycle" loop trigger now drives the DESIGN catalog (design-cycle), one criterion/iteration, caos→verde + mutation family, grounded in real private-repo escapes.

**DONE — jsdom tier, 6 criteria (all green, pushed):** token-adherence (uses-tokens-only), theme-parity (flips-with-theme), type-hierarchy (hierarchy-holds), composition-canonical (canonical-composition), state-coverage (states-visually-distinct), color-contrast (contrast-sufficient). 24/24 mutants killed, false-alarm 0. Behaviour catalog (39/39, 14 archetypes) separate + untouched.

**FILE MAP (adapter pattern — each criterion = these 5 touches):** `src/archetypes/<name>.ts` (reuse core/dsl archetype/criterion/mechanical), `src/adapter-design/<name>.ts` (probe+hooks), 1 line in `src/adapter-design/verify.ts` REGISTRY (verifyDesign dispatcher, reuses core/run.ts), `bench/dataset/<x>.tsx` (good + mutants), `bench/<name>.test.ts` (accuracy+detection+mutation). Ground truth: `src/design/tokens.ts` (tokens/tokenScale/normColor + themes/themeColorScale) + `src/design/contrast.ts` (WCAG ratio). Subject seams in `src/adapter-design/subject.ts`: render, renderTheme(theme), composition[], states[]+renderState(state). Design archetypes NOT in behaviour protocol.json (no drift-guard coupling). Plan/status doc: `docs/design-acceptance.md`.

**NEXT = Playwright geometry tier** (no jsdom path, offsetWidth=0): spacing-rhythm (user's explicit 4×/2×/1× nested padding ratio), layer-integrity (z-index/overlay stacking), layout-integrity (overflow/overlap/responsive). Must stand up @playwright/test in avp (NOT installed) or reuse the `proof` plugin browser harness; new browser-based design probe. Heavier — may hit a substrate-availability blocker in this env (report honestly, like .NET was for behaviour). Then icon-correctness via claudeJudge (model oracle). Geometry escapes dominate cal.com (spacing 82, overflow 78, responsive 88) → high value.

**LEAK PROTOCOL (non-negotiable — a name reached public origin/main iter 4, scrubbed via amend+force-with-lease):** every commit gates `git add … && git grep --cached -niE "<3 names>" -- . ':!package-lock.json' ':!…fc2e2566*' && { abort } || { commit }` — BLOCK, never warn-and-proceed (`;`). NEVER write private names in .pleiades item bodies (they commit to the PUBLIC repo github.com/lucasrgt/acceptance-verification-protocol). Anonymize per docs/transfer.md: marketplace / project P / project F. Private repos live at C:\Users\lucas\dev\<name>-monorepo for the three Lazuli apps — the real <name>→anon mapping is in the LOCAL-ONLY gitignored map (item fc2e2566), never in a tracked file. Acervo: dev/_acervo/{cal.com,documenso,firefly-iii,bitwarden-server}. [[d3b154e2]] [[a81932ba]]
