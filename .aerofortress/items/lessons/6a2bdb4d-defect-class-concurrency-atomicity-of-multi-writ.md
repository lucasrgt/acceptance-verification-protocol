---
id: 6a2bdb4d-87e6-49a0-8d27-6dcd0278a638
slug: lessons
type: doc
title: Defect class: concurrency/atomicity of multi-write mutations — PROPOSED new archetype mutation-atomicity
tags: avp-candidate, new-archetype, mutation-atomicity, backend
provenance: observado
evidence: avp/docs/defect-ledger.md §6; pauta@b00c9c4 f85820f; hostpoint@c0a0c63c; scar fluxoterra 1b479706
decay: seasonal
created: 2026-07-02T04:32:27.363445+00:00
updated: 2026-07-02T04:32:27.363445+00:00
validated: 2026-07-02T04:32:27.363445+00:00
links: 
---

First harvest, 4 occurrences: pauta@b00c9c4 (ADR 0008), f85820f; hostpoint@c0a0c63c; scar fluxoterra/1b479706 (modeled token not enforced — silent last-write-wins). Mutations spanning several writes (or token-carrying updates) are not transactional/guarded. **AVP candidate: NO runtime coverage — proposed archetype `mutation-atomicity`**, criteria `concurrent-conflict-surfaces` (two conflicting updates, same token: exactly one wins, loser gets a visible conflict) and `multi-write-is-atomic` (failure mid-mutation leaves no partial state). Complements static AF0026. See docs/defect-ledger.md §6.
