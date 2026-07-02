---
id: dc6a4883-8477-4831-a6fc-213cd5453cfe
slug: lessons
type: doc
title: Defect class: silent failure / phantom success — implement the backend half of action-effect
tags: avp-candidate, phantom-success, new-oracle
provenance: observado
evidence: avp/docs/defect-ledger.md §2; pauta@381187c b831091; hostpoint@6c6579f1 4b5f4230 2a2c7f4d
decay: seasonal
created: 2026-07-02T04:32:27.357725800+00:00
updated: 2026-07-02T04:32:27.357725800+00:00
validated: 2026-07-02T04:32:27.357725800+00:00
links: 
---

First harvest, 5 occurrences: pauta@381187c, b831091; hostpoint@6c6579f1, 4b5f4230, 2a2c7f4d. Failure path returns/renders as success (error caught and dropped). **AVP candidate: covered in catalog (action-effect: no-phantom-success) but NO .NET oracle.** Candidate = backend `phantom-success` oracle: force a dependency (mail/webhook/db) to fail, assert non-2xx / error envelope, never bare success. See docs/defect-ledger.md §2.
