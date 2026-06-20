---
id: 6ce28c05-46d3-4c0a-941f-1cbf111c64cd
slug: specs
type: doc
title: FE round COMPLETE: 6 archetypes / 16 criteria executed, detection 16/16
tags: frontend, archetypes, fe-round, detection-16, tanstack-router, complete
provenance: observado
evidence: bench/ 43/43 green; commits 327ceb0, 7114c1e, 88f78d5, 81936a6, 0976373; docs/catalog.md status
decay: seasonal
created: 2026-06-20T14:36:40.732739900+00:00
updated: 2026-06-20T14:47:19.113351400+00:00
validated: 2026-06-20T14:47:19.113351400+00:00
links: 
---

FE deepening round COMPLETE (user: "frontend deu mais dor de cabeça" → all 4 next-steps shipped). 6 archetypes, detection 16/16, false-alarm 0, suite 43/43, tsc clean.

SHIPPED THIS ROUND:
- action-effect tail (327ceb0): +request-accepted (c1849234), +idempotent-retry (0188869f), +survives-token-refresh (b4b0fc07). Added Condition axis 3 (interaction/recovery: retry, token-expired). action-effect = 7 criteria.
- mount-stability (7114c1e): NEW archetype. settles-without-storm — bounded requests on mount; a refetch/redirect storm freezes the splash (e6c81abe + projp:626c8ce).
- navigation nested-renders (88f78d5): parent-without-Outlet — route resolves but renders blank. Uses a REAL mounted TanStack router (@tanstack/react-router devDep, ^1.170; apps use ^1.120). projp:37af286/039aaf2.
- navigation back-has-fallback (81936a6): dead Voltar — deep link, no history, back is a no-op. Mounted router + click. 3aa1c80a.
- data-honesty flash-of-id (0976373): raw GUID painted before the resolved name. 2-stage paint-timing probe (delay name endpoint, sample the gap). projp:ce04d0f/33a0d5a.

ARCHITECTURE: navigation-integrity + data-honesty each now dispatch ACROSS TWO PROBE SHAPES behind one archetype (navigate-spy vs mounted-router; list vs detail), gated by subject seam in applies(). Proves the neutral core handles multiple substrates per archetype. 4+ distinct probe substrates total.

REMAINING (catalogued, not executed): optimistic-reconcile, cache-cleared-on-identity, no-redirect-loop, count-matches-source; BE archetypes (Assay.NET); STATIC (host doctor). Plus the still-held in-app runtime dogfood (wire verify() into a real app's harness + push) and the lazuli doctor enable.
