---
id: 151f1bfe-253c-4f07-b0bc-634e4b2efea2
slug: specs
type: doc
title: The criteria catalog — the curated dictionary (docs/catalog.md)
tags: catalog, dictionary, archetypes, criteria, taxonomy, criterion-1
provenance: observado
evidence: docs/catalog.md; mined from ~480 commits of the tourism monorepo via 3 diff-extraction agents
decay: seasonal
created: 2026-06-20T04:24:37.355168800+00:00
updated: 2026-06-20T04:24:37.355168800+00:00
validated: 2026-06-20T04:24:37.355168800+00:00
links: 
---

`docs/catalog.md` = THE curated dictionary (criterion 1 of the overnight goal), mined by error-analysis over the full ~480-commit history of the tourism monorepo (each fix commit = a labelled escape). 11 archetypes, ~30 criteria, ranked by escape frequency, each with reach (FE/BE/STATIC) + oracle (mechanical/model/human/static) + source escapes.

RANKED ARCHETYPES (what broke the most):
1. **navigation-integrity** (FE, largest) — target-resolves, back-has-fallback, no-redirect-loop, required-params-guarded, contract-mints-no-routes(static).
2. **persona-scoped-visibility** (FE+BE) — no-cross-persona-affordance, no-cross-persona-route, chooser-scoped-to-build. THE transfer experiment (RQ4).
3. **action-effect** (FE, hero) — fires-primary-effect, no-phantom-success, error-is-specific(model), request-accepted, idempotent-retry, survives-token-refresh, projections-converge, optimistic-reconcile, cache-cleared-on-identity.
4. **lifecycle-gate** (FE+BE) — gate-enforced-server-side, blocked-action-is-disabled.
5. **integration-integrity** (BE) — webhook-signature-verified, callback-resolves-entity, redirect-urls-bound.
6. **second-order-effects** (BE) — notifies-all-parties.
7. **authorization** (BE) — own-resource-only (IDOR), role-required, server-is-authoritative.
8. **data-honesty** (FE, LLM-specific) — no-fixture-fallback, no-fabricated-media, count-matches-source.
9. **money-integrity** (BE+static) — split-invariant, money-is-typed(static), money-formatted-once(static).
10. **state-completeness** (STATIC — host doctor LZFE010).
11. **i18n-honesty** (STATIC — LZFE011/014).

DISTRIBUTION (the thesis in numbers): ~45% FE-observable (Assay's domain), ~40% backend-only (justifies Assay.NET), ~15% best static (host doctor). Several escapes BECAME doctor rules after the fact (redirect-loop→LZFE015, navigation-cast→LZFE030) — the escape→static-rule convergence happening organically; Assay formalizes the runtime half. Determinism is LAYERED: the catalog is the verifier, it routes each criterion to where it can be decided.
