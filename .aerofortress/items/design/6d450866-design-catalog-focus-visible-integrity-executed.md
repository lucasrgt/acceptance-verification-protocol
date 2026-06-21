---
id: 6d450866-6149-4467-8754-d9727f82b69a
slug: design
type: project
title: Design catalog · focus-visible-integrity executed (geometry tier; WCAG 2.4.7 keyboard focus ring)
tags: 
provenance: observado
evidence: tsc --noEmit exit 0; new bench detection 1/1 false-alarm 0, mutation 4/4 killed; full suite 220/220 green (53 files). Files: src/archetypes/focus-visible-integrity.ts, src/adapter-design/focus-visible-integrity.ts, bench/dataset/focus-targets.tsx, bench/focus-visible-integrity.test.ts; registered in browser-verify.ts REGISTRY + protocol.ts DESIGN_ARCHETYPES; protocol/design-catalog.json regenerated.
decay: stable
created: 2026-06-21T05:37:50.181063100+00:00
updated: 2026-06-21T05:37:50.181063100+00:00
validated: 2026-06-21T05:37:50.181063100+00:00
links: 
---

**assay-cycle iteration — new DESIGN criterion `focus-visible-integrity · focus-is-visible`** (geometry tier, browser-measured). The keyboard-a11y invariant: every interactive control must paint a VISIBLE focus indicator when focused (WCAG 2.4.7). Canonical escape = `outline: none` / `focus:outline-none` with no replacement ring → keyboard focus is invisible.

**Why geometry/browser, not jsdom:** the focus ring is a `:focus` pseudo-class style change; jsdom applies NO pseudo-class styles. The probe focuses each control in real Chrome (puppeteer-core, installed-browser path) and compares computed outline/box-shadow/border/background BEFORE vs AFTER `.focus()` — an indicator is a focus-induced visible CHANGE (a permanent border doesn't count; a transparent ring or zero-width outline paints nothing). Programmatic `.focus()` triggers `:focus` (which the fix uses, Tailwind `focus:`), deterministic; baseline neutralises the UA outline so each variant's `:focus` rule is the only focus paint.

**Faithfully grounded (gold rule — real diffs read):** cal.com focus-ring cluster — `calcom:7393ba1d1` "Fixing focus visible" (the canonical `focus:outline-none` with no ring, fixed by adding `focus:ring-brand-800 focus:ring-1`), `calcom:689150d78` "align email focus ring", `calcom:c1b41d825` "Wrong focus ring on Help Dropdown". Diffs inspected via `git show` in dev/_acervo/cal.com.

**Mutation 4/4 killed** (distinct ways the indicator is missing/paints nothing): no-indicator (outline:none, nothing added), transparent-ring (box-shadow colour transparent), hover-only (ring on :hover not :focus), zero-outline (outline:0 width). GOOD (box-shadow ring on focus) green.

**Distinctness:** vs tap-target (control SIZE), vs state-coverage (jsdom, declared states distinct), vs color-contrast (text/bg ratio) — this is whether FOCUSING changes the paint.

**CONCURRENCY FLAG (this iteration):** a parallel assay-cycle iteration concurrently authored a sibling design criterion `accessible-name` (src/archetypes/accessible-name.ts + adapter + bench/labeled-controls.tsx, registered in verify.ts jsdom dispatcher) in the SAME working tree, regenerating design-catalog.json at 02:35:41 while my tests ran. Both increments are green together (suite 220/220). I HELD my commit: protocol.ts + design-catalog.json now intermix both increments and can't be split into a clean per-iteration commit without destroying or misattributing the concurrent work. Resolution: one combined commit (focus-visible + accessible-name) once the concurrent iteration settles, or coordinate ordering. [[6b45e83c]]
