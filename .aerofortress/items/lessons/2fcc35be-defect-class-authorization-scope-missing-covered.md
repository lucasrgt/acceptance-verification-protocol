---
id: 2fcc35be-ab37-41d1-8b5b-9a8dee5fb9eb
slug: lessons
type: doc
title: Defect class: authorization scope missing — covered-but-escaped, declare per-slice
tags: avp-candidate, authorization, harden-binding
provenance: observado
evidence: avp/docs/defect-ledger.md §1; hostpoint@1db3c2fd d0f1d0c8 085a5c20 ab63c1e6; pauta@d2373ab fc51908
decay: seasonal
created: 2026-07-02T04:32:27.345834600+00:00
updated: 2026-07-02T04:32:27.345834600+00:00
validated: 2026-07-02T04:32:27.345834600+00:00
links: 
---

First harvest (2026-07-02), 6 occurrences: hostpoint@1db3c2fd, d0f1d0c8, 085a5c20, ab63c1e6; pauta@d2373ab, fc51908. Handler trusts a foreign id without pinning it to the principal's ownership/tenancy. **AVP candidate: covered-but-escaped** — `authorization` (own-resource-only, server-is-authoritative) is runnable; the escapes happened on slices that never DECLARED it (repo-wide representative binding proves the mechanism once, not each surface). Harden = declare per-slice on every mutation taking a foreign id (af g slice --verify makes it cheap at birth). See docs/defect-ledger.md §1.
