---
id: 268d9884-094f-489f-86ed-335babcad2d6
slug: lessons
type: doc
title: Defect class: second-order notification missing — harden notifies-all-parties with a state-based seam
tags: avp-candidate, second-order-effects, harden-bindability
provenance: observado
evidence: avp/docs/defect-ledger.md §3; hostpoint@81c919ed fd1493e7 fbc56236; pauta@fc51908
decay: seasonal
created: 2026-07-02T04:32:27.369131400+00:00
updated: 2026-07-02T04:32:27.369131400+00:00
validated: 2026-07-02T04:32:27.369131400+00:00
links: 
---

First harvest, 4 occurrences: hostpoint@81c919ed, fd1493e7, fbc56236; pauta@fc51908. The primary effect lands; the counterpart's notification is forgotten on SOME transitions. **AVP candidate: covered-but-not-bindable (second-order-effects is synthetic — known false-green class).** Hardening = state-based signal: an outbox/notifications table the oracle reads after driving the transition, so NotifySubject binds a REAL subject. See docs/defect-ledger.md §3.
