---
id: f41ef0f1-2049-457a-b658-686e5c0f033a
slug: lessons
type: doc
title: Defect class: webhook/integration state contract — harden integration-integrity with webhook-effects-state
tags: avp-candidate, integration-integrity, new-criterion
provenance: observado
evidence: avp/docs/defect-ledger.md §7; hostpoint@53fcf804 596f1594 0d8d81d5; scar 8d6169d0
decay: seasonal
created: 2026-07-02T04:32:27.351576100+00:00
updated: 2026-07-02T04:32:27.351576100+00:00
validated: 2026-07-02T04:32:27.351576100+00:00
links: 
---

First harvest, 3 occurrences + 1 scar: hostpoint@53fcf804, 596f1594, 0d8d81d5; scar avp/8d6169d0 (200-always handlers can't bind webhook-signature-verified honestly). The real invariant is the STATE the webhook leaves behind, not the response code. **AVP candidate: harden — proposed criterion `webhook-effects-state`**: deliver a valid then an invalid webhook; domain state (via a read endpoint) reflects exactly the valid one. The bindable sibling of webhook-signature-verified. See docs/defect-ledger.md §7.
