---
id: d3b154e2-0a67-40dd-9c58-36777a8b9756
slug: design
type: project
title: Design catalog · color-contrast executed — jsdom tier COMPLETE (6 criteria)
tags: 
provenance: observado
evidence: commit 4ada8d6 (38b127c..4ada8d6); bench/color-contrast.test.ts detection 1/1 + mutation 4/4; full suite 173 tests green, tsc 0
decay: stable
created: 2026-06-20T20:36:49.474309700+00:00
updated: 2026-06-20T20:36:49.474309700+00:00
validated: 2026-06-20T20:36:49.474309700+00:00
links: 
---

**Design-cycle iteration 5 — 6th design criterion; jsdom tier DONE.** `color-contrast · contrast-sufficient`: every text/background pair meets WCAG AA (4.5:1 normal, 3:1 large). DISTINCT from token-adherence/theme-parity — a pair can be perfectly on-scale and still fail contrast (muted text on white).

**Verifier (jsdom, no axe dep):** src/design/contrast.ts computes WCAG relative-luminance ratio directly. The probe finds each text-bearing element (inline color + own text node), resolves its effective background (nearest ancestor with inline bg, else white), computes ratio vs aaThreshold(fontSize,bold). Mutation 4/4: muted-on-white ~2.6, light-on-white ~1.2, dark-on-dark ~1 (invisible), light-danger ~2.5. GOOD ~17:1 green. seenIn dd834c98 (light badge in dark = low-contrast pair).

**Design catalog now 6 criteria (token-adherence, theme-parity, type-hierarchy, composition-canonical, state-coverage, color-contrast), 24/24 mutants killed, false-alarm 0 — the entire jsdom tier is complete.** All through core/run.ts; behaviour catalog separate + untouched (39/39).

**NEXT = Playwright geometry tier** (docs/design-acceptance.md step 3): spacing-rhythm (the user's explicit 4×/2×/1× nested padding-ratio example), layer-integrity (z-index/overlay stacking), layout-integrity (overflow/overlap/responsive). These have NO jsdom path (offsetWidth=0) — they need a real browser. Architectural step: stand up @playwright/test in avp (or reuse the proof plugin's harness), a browser-based design probe. Bigger setup; likely its own iteration.

**Leak postmortem (iter 4):** a private name reached public origin/main in a .pleiades item body; scrubbed via amend+force-with-lease; root cause = leak-scan chained with `;` not `&&`. Now ALL design-cycle commits gate on `&& abort`. [[42005b73]]
