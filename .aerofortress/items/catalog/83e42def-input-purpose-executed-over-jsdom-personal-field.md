---
id: 83e42def-dd0e-471d-b360-210d3c4d4828
slug: catalog
type: project
title: input-purpose executed over jsdom — personal-fields-declare-purpose (WCAG 1.3.5, dom, 20 design criteria)
tags: 
provenance: observado
evidence: npx vitest run: 232 tests green; npx tsc --noEmit clean; bench/input-purpose.test.ts detection=1/1 mutation killed=4/4
decay: stable
created: 2026-06-21T05:54:26.834866700+00:00
updated: 2026-06-21T05:54:26.834866700+00:00
validated: 2026-06-21T05:54:26.834866700+00:00
links: 
---

Iteration 4 added the **input-purpose** design archetype (criterion `personal-fields-declare-purpose`, WCAG 1.3.5 Identify Input Purpose): every input collecting a known kind of personal data — identified UNAMBIGUOUSLY by type (email/tel/password) or a high-confidence name/id pattern (email, phone, first/last name, street, postal-code, organization, card) — must declare an `autocomplete` token.

Scoped TIGHT to keep false-alarm 0: an opaque field (search box, arbitrary text) gets no opinion; any present `autocomplete` (even `off`) is the author's decision — the escape is its ABSENCE, mirroring image-alt's decorative branch. dom substrate (no computed style, no layout).

Files: src/archetypes/input-purpose.ts, src/adapter-design/input-purpose.ts, bench/input-purpose.test.ts, bench/dataset/signup-form.tsx. Registered in protocol.ts DESIGN_ARCHETYPES + adapter-design/verify.ts REGISTRY; serialized into protocol/design-catalog.json. Detection 1/1, false-alarm 0, mutation 4/4 (email/password/phone/name each losing its token; search box never flagged). Grounded in cal.com autocomplete cluster (#24422, #21065, #6705, #2645). Committed scoped (no git add -A) to avoid the concurrency collision.

Design catalog now **20 criteria** — style(7) + dom(3: accessible-name, image-alt, input-purpose) + geometry(9) + model(1), 72/72 mutants. Full suite 232 green, tsc clean.

FRONTIER NOW LIKELY DRY: input-purpose was the last medium-value grounded FE/design candidate (see [[frontier-assessment-iter-3-a11y-design-tier-thin]]). Remaining: heading-order/table (ungrounded here), static rules (host doctor), or backend depth (Assay.NET, .NET-blocked). Next mining round should confirm dry → stop condition. Related: [[image-alt-executed-over-jsdom-images-have-text-a]].
