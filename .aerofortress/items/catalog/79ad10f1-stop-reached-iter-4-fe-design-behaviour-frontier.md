---
id: 79ad10f1-8ef7-4c62-98bc-87e61c3bc420
slug: catalog
type: project
title: Stop reached (iter 4): FE/design+behaviour frontier dry — remaining value is .NET-blocked backend
tags: 
provenance: observado
evidence: iter-4 final mine cal.com+documenso for aria-modal/focus-trap/aria-live/skip-link/landmark: dry; design catalog 20 criteria 72/72 mutants; full suite 232 green
decay: stable
created: 2026-06-21T05:55:36.728551600+00:00
updated: 2026-06-21T05:55:36.728551600+00:00
validated: 2026-06-21T05:55:36.728551600+00:00
links: 
---

The assay-cycle loop's FE/HTTP-reachable, high-value, well-grounded frontier is EXHAUSTED across both catalogs.

BEHAVIOUR catalog (docs/catalog.md): fully executed (39/39 across 14 archetypes); the cross-stack frontier (temporal, pagination, render-resilience, request-idempotency, single-flight) was harvested in a prior sweep and declared dry. Remaining is STATIC (host doctor) or backend (Assay.NET, .NET-blocked).

DESIGN/a11y catalog (docs/design-acceptance.md): now 20 criteria — style(7) + dom(3: accessible-name, image-alt, input-purpose) + geometry(9: layout, layer, responsive, reading-order, rtl, tap-target, layout-shift, focus-visible, truncation) + model(1: icon). 72/72 mutants, false-alarm 0. This loop run added: accessible-name, image-alt, input-purpose (mine) + focus-visible-integrity, truncation-integrity (concurrent peer).

FINAL MINING SWEEP (iter 4, cal.com + documenso) for remaining a11y classes — aria-modal/focus-trap, aria-live/role=alert/error-announcement, skip-link, landmark, aria-current/expanded — came up DRY: zero faithful fix-commit grounding. Candidates that remain are either ungrounded in the corpus (heading-order, table-headers, dialog-a11y), STATIC (host doctor: duplicate-id, aria-validity, html-lang, document-title), or backend (.NET-blocked).

STOP CONDITION MET: "a mining+selection round finds no more high-value uncovered criterion whose adapter (FE/HTTP) exists." The next bulk of value is backend depth — Assay.NET — which the loop explicitly excludes (.NET-blocked). Independently corroborated by peer note [[loop-assay-cycle-2026-06-21-fe-design-frontier-d]]. Related: [[input-purpose-executed-over-jsdom-personal-field]] [[frontier-assessment-iter-3-a11y-design-tier-thin]].
