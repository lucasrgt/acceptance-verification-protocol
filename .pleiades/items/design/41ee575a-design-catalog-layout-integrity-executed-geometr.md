---
id: 41ee575a-cc2a-4986-a868-be0c66890ed9
slug: design
type: project
title: Design catalog · layout-integrity executed — GEOMETRY tier stood up (puppeteer-core + installed Chrome)
tags: 
provenance: observado
evidence: commit 6eff797 (667e58e..6eff797); smoke test measured scrollWidth 347 vs clientWidth 80 in headless Chrome; bench/layout-integrity.test.ts detection 1/1 + mutation 3/3; full suite 44 files/181 tests green, tsc 0
decay: stable
created: 2026-06-20T20:49:06.725936900+00:00
updated: 2026-06-20T20:49:06.725936900+00:00
validated: 2026-06-20T20:49:06.725936900+00:00
links: 
---

**Design-cycle iteration 7 — 8th design criterion; GEOMETRY/browser tier STOOD UP.** The substrate question is RESOLVED empirically: Playwright NOT installed, but Chrome+Edge ARE on the box → drive installed Chrome via **puppeteer-core** (devDep, no ~150MB download). Smoke test confirmed real layout (scrollWidth 347 vs clientWidth 80).

`layout-integrity · content-fits`: no element clips its own content (cut off by a too-small box with hidden overflow). The one class with NO jsdom path (offsetWidth=0). Mutation 3/3: horizontal clip (nowrap long text), vertical clip (text past fixed height), button-label clip. GOOD roomy card green.

**Architecture (the browser sub-tier):** `src/adapter-design/browser.ts` (openBrowser/chromePath — auto-detect Chrome/Edge, CHROME_PATH override, headless --no-sandbox), `src/adapter-design/browser-verify.ts` (`verifyDesignBrowser(archetype, subject, page)` — own REGISTRY, reuses the SAME core/run.ts), `src/adapter-design/layout-integrity.ts` (probe: renderToStaticMarkup(subject.render()) → page.setContent → page.evaluate(measureClips) reading real scrollWidth/clientWidth + computed overflow). Bench owns the browser lifecycle (beforeAll openBrowser, afterAll close, shared page); `describe.skipIf(!chromePath())` skips HONESTLY if no browser (substrate unavailable ≠ green). seenIn calcom:635c1feb/a1124ede/e8e50b70 (overflow cluster, 78 fixes).

**Design catalog: 8 criteria — jsdom tier (7: token-adherence, theme-parity, type-hierarchy, composition-canonical, state-coverage, color-contrast, spacing-rhythm) + browser tier (1: layout-integrity). 31/31 mutants killed, false-alarm 0.** Behaviour catalog untouched (39/39).

**NEXT (browser tier):** layer-integrity (two siblings that visually OVERLAP via getBoundingClientRect intersection — z-index/overlay escapes, cal.com z-index=21), responsive-across-breakpoints (render at narrow+wide viewports, assert no new overflow/clip). Then icon-correctness via claudeJudge (model oracle — the toilet≠shower meaning-fit). [[6b45e83c]]
