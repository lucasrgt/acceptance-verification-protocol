---
id: c28ea494-d382-4b98-9462-2a2d8f839d4c
slug: specs
type: doc
title: Escape miner + multi-stack corpus: catalog is cross-stack (5 langs, 6 OSS apps)
tags: corpus, transfer, rq4, miner, cross-stack, tier-1, multistack
provenance: observado
evidence: tools/escape-miner/mine.cjs; docs/corpus-multistack.md; mined pocketbase/documenso/mastodon/monica/bitwarden/gitea
decay: seasonal
created: 2026-06-20T15:09:49.286066900+00:00
updated: 2026-06-20T15:09:49.286066900+00:00
validated: 2026-06-20T15:09:49.286066900+00:00
links: 
---

Built the tier-1 escape miner (tools/escape-miner/mine.cjs): blobless clone → git log → keep fix-shaped commits → classify by archetype (message+path keywords). HEURISTIC/noisy on purpose; classifies ~8-15% (the clearly-labelled), rest unclassified → counts are a LOWER BOUND, distribution is the signal, some rows are FPs.

VALIDATED on the 3 local Lazuli apps: reproduces the hand-mined top archetypes (the marketplace: authz/persona 12 + nav 11 lead; project P: nav leads). Tool is sound.

MINED a multi-stack slice (blobless clones in dev/_acervo, NOT committed): pocketbase(Go), documenso(Node/Next), mastodon(Rails), monica(Laravel), bitwarden/server(.NET), gitea(Go). ~1120 classified escapes (lower bound).

RESULT — catalog is CROSS-STACK, not framework luck. 3 archetypes in ALL 6 unrelated repos: second-order-effects, authorization/persona, integration-integrity. nav/projection/action-effect/validation in 5/6. Exact-match confirmations in stacks never mined: bitwarden .NET "Cross-Organization IDOR in Bulk User Revoke"=own-resource-only; mastodon Rails "stale collections list after deleting"=projections-converge + "show error instead of failing silently"=no-phantom-success + "infinite loop in Scheduler"=mount-stability; documenso Node "idempotent stripe webhook sync"=integration-integrity.

IMPLICATIONS: RQ4 transfer at scale (kills overfit critique). FE/BE split sharpens — backend-heavy apps dominated by notify/integration/authz → confirms ~40% backend = Assay.NET / a language-neutral HTTP adapter (authz/idempotency/webhook/notify are HTTP-observable across any backend).

NEXT: tier-1.5 classifier (diff/LLM, raise recall); first EXECUTED cross-stack backend repro (e.g. bitwarden IDOR via an HTTP adapter) = first executed backend transfer datapoint. Clones live in dev/_acervo (regenerable, blobless), never committed.
