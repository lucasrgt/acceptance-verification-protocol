---
id: 4285570c-13d9-4f37-bd0c-2c3bfbc352f9
slug: design
type: decision
title: Geometry probes load surfaces via adapter-design/surface.ts (loadSurface/loadMarkup)
tags: assay-design, geometry-tier, surface, loadSurface, refactor, lean, real-app-url-seam
provenance: observado
evidence: src/adapter-design/surface.ts; all geometry probes import loadSurface/loadMarkup from it; tsc clean + 51 files/211 tests green
decay: stable
created: 2026-06-20T21:44:12.305427900+00:00
updated: 2026-06-20T21:44:12.305427900+00:00
validated: 2026-06-20T21:44:12.305427900+00:00
links: 
---

The browser/geometry design probes share ONE surface-loading seam: `src/adapter-design/surface.ts`.

- `loadSurface(page, subject, what)` — the single-surface path used by layout, layer,
  responsive, reading-order, rtl, tap-target. Two sources:
  - `subject.url` → `page.goto(url)` — drive a LIVE running app (the real-app pilot path;
    the app's own CSS/JS produce the real layout jsdom can't see).
  - `subject.render()` → `loadMarkup(page, element)` — the bench path (synthetic good/bad
    surfaces; geometry carried by inline styles).
  - neither seam → throws `AvpFail(`${what} needs a render() or url seam.`)`.
- `loadMarkup(page, element)` — renderToStaticMarkup + the `<!doctype>…margin:0` page
  template, in ONE place. Probes that render SEVERAL surfaces call it directly per element
  (layout-shift-integrity: loading→loaded states).

The probe OWNS the viewport (setViewport before/around the load); surface.ts only puts the
DOM on the page. `renderToStaticMarkup` and the page-template string now exist in exactly one
file (was duplicated across all 7 geometry probes).

New seam: `ReactDesignSubject.url?` — the bridge to driving a real running app instead of a
synthetic bench surface (aligns with the proof plugin's e2e direction). Wired through
loadSurface; the bench still exercises render(), but the lib path exists.

Provenance: a lean/ponytail consolidation of the duplicated browser-load boilerplate I'd
written inline in each geometry probe. tsc clean, full suite 51 files / 211 tests green after
the refactor. Adding a new geometry probe: setViewport + `await loadSurface(page, subject,
'<archetype>')` + page.evaluate(measureFn) — don't re-inline renderToStaticMarkup/setContent.
