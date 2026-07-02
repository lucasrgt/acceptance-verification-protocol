---
id: e6b7eddd-396b-4ef2-9d19-70c2c48a4215
slug: lessons
type: doc
title: Defect class: stale/absent data shape breaks the UI — design-tier candidate shape-tolerance
tags: avp-candidate, design-tier, shape-tolerance, frontend
provenance: observado
evidence: avp/docs/defect-ledger.md §9; fluxoterra@c5c44d9; pauta@b1b4b6c; hostpoint@e6c81abe
decay: seasonal
created: 2026-07-02T04:32:27.339291100+00:00
updated: 2026-07-02T04:32:27.339291100+00:00
validated: 2026-07-02T04:32:27.339291100+00:00
links: 
---

First harvest, 3 occurrences: fluxoterra@c5c44d9 (null buyers on old snapshot), pauta@b1b4b6c (undefined page crash), hostpoint@e6c81abe (anonymous /me refetch storm). Data persisted under an older shape reaches a view written for the newest only. **AVP candidate: design-tier `shape-tolerance`** — rendering over the previous persisted shape never throws (degraded, labeled, alive). Low urgency, high recurrence. See docs/defect-ledger.md §9. (Class 8 of the ledger — hand-rolled spine twins, incl. the SAME fix in pauta@6128cf9 + fluxoterra@453460c — routes to the framework doctor, not the catalog.)
