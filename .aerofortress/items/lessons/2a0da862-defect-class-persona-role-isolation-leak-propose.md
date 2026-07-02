---
id: 2a0da862-3508-478b-a757-22e2165670b0
slug: lessons
type: doc
title: Defect class: persona/role isolation leak — PROPOSED new archetype persona-isolation (frontend)
tags: avp-candidate, new-archetype, persona-isolation, frontend
provenance: observado
evidence: avp/docs/defect-ledger.md §5; hostpoint@28670a98 1e6ba089 e768c8ad 311e9504 f0d10d51
decay: seasonal
created: 2026-07-02T04:32:27.374817700+00:00
updated: 2026-07-02T04:32:27.374817700+00:00
validated: 2026-07-02T04:32:27.374817700+00:00
links: 
---

First harvest, 5 occurrences (all hostpoint two-apps): 28670a98, 1e6ba089, e768c8ad, 311e9504, f0d10d51. One codebase, N personas, scattered guards — one ungated surface mounts the opposite persona. **AVP candidate: NO coverage — proposed archetype `persona-isolation`**, criterion `opposite-persona-never-mounts`: with the build role fixed to A, driving any persona-B route never renders B's shell. Signal: route-table sweep against a role-fixed build. Home: assay JS (dom/route substrate). See docs/defect-ledger.md §5.
