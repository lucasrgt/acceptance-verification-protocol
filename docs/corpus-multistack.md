# Multi-stack corpus — the catalog is cross-stack, not cross-project luck

`docs/transfer.md` showed the archetypes recur across three projects that share one
framework. The obvious objection: *maybe they share the framework's failure modes*.
This kills that objection. We mined six well-known open-source web apps across
**five independent language stacks** — none related, none sharing a framework — and
the same archetypes surface in every one.

## Method (honest)

- Tool: `tools/escape-miner/mine.cjs` (tier-1). Blobless clones (`git clone
  --filter=blob:none --no-checkout`), walk `git log`, keep fix-shaped commits,
  classify each by archetype from message + path signals.
- **Tier-1 is keyword-heuristic — deliberately noisy.** It classifies only the
  clearly-labelled fixes (≈8–15% of fix-shaped commits); the rest are
  `unclassified` (terse messages a keyword can't place). So every number below is a
  **lower bound**, and a few rows are false positives (e.g. a "fixture" in a *test*
  commit, an "email" in a CSS fix). The signal is the **distribution across stacks**,
  not any single row. Tier-1.5 (diff-based / LLM classification) would raise recall.
- We extract failure *patterns*, never code. Repros stay ours; refs stay opaque.

## The slice

| repo | domain | stack | commits | fix-shaped | classified |
|---|---|---|---|---|---|
| pocketbase | backend-as-a-service | Go | 2 253 | 275 | 17 |
| documenso | e-signature SaaS | Node/TS (Next) | 3 573 | 1 216 | 185 |
| mastodon | social network | Rails/Ruby | 21 198 | 4 987 | 394 |
| monica | personal CRM | Laravel/PHP | 966 | 131 | 8 |
| bitwarden/server | password manager | .NET | 7 340 | 846 | 107 |
| gitea | git forge | Go | 19 948 | 5 345 | 410 |

≈**1 120 classified escapes** in the slice (a lower bound), on top of the three
local Lazuli apps from `docs/transfer.md`.

## The cross-stack archetype matrix

Counts of classified escapes per archetype per repo (tier-1, lower bound).

| archetype | pb·go | doc·node | mas·rails | mon·laravel | bw·dotnet | gitea·go | repos |
|---|--:|--:|--:|--:|--:|--:|:--:|
| second-order-effects (notify) | 4 | 46 | 115 | 2 | 38 | 80 | **6/6** |
| authorization / persona | 1 | 5 | 26 | 1 | 10 | 46 | **6/6** |
| integration-integrity (webhook/oauth/pay) | 1 | 55 | 25 | 1 | 19 | 92 | **6/6** |
| navigation-integrity | 4 | 23 | 73 | 0 | 3 | 78 | 5/6 |
| projection / cache (stale) | 1 | 11 | 45 | 0 | 3 | 19 | 5/6 |
| action-effect | 5 | 1 | 10 | 0 | 5 | 7 | 5/6 |
| validation / request | 1 | 5 | 21 | 0 | 12 | 16 | 5/6 |
| i18n-honesty | 0 | 27 | 54 | 4 | 0 | 41 | 4/6 |
| money-integrity | 0 | 4 | 3 | 0 | 14 | 13 | 4/6 |
| lifecycle-gate | 0 | 6 | 12 | 0 | 0 | 3 | 3/6 |
| mount-stability | 0 | 0 | 4 | 0 | 1 | 4 | 3/6 |
| state-completeness | 0 | 2 | 3 | 0 | 0 | 3 | 3/6 |
| data-honesty (noisy: test fixtures) | 0 | 0 | 3 | 0 | 2 | 8 | 3/6 |

**Three archetypes appear in all six unrelated codebases** (second-order-effects,
authorization/persona, integration-integrity); navigation, projection,
action-effect and validation in five of six. The catalog is a property of *web
software*, not of one team or one framework.

## Exact-match confirmations (the gold)

Real fixes from the slice that map one-to-one onto catalog criteria — in stacks
the catalog was never mined from:

- **`own-resource-only` (authorization), .NET** — bitwarden: *"Fix Cross-Organization
  IDOR in Bulk User Revoke"*. Textbook IDOR, another language.
- **`projections-converge`, Rails** — mastodon: *"Fix stale collections list after
  deleting a collection"*. The same stale-projection invariant.
- **`no-phantom-success`, Rails** — mastodon: *"Show error when submitting empty post
  rather than failing silently"*.
- **`settles-without-storm` (mount-stability), Rails** — mastodon: *"infinite loop in
  AccountsStatusesCleanupScheduler"*, *"too many requests caused by relationship
  look-ups"*.
- **`integration-integrity` + idempotency, Node** — documenso: *"rework stripe
  webhooks into idempotent subscription sync"*.
- **`money-integrity`, .NET** — bitwarden: *"Fix the currency culture invariant"*.
- **authorization + lifecycle, Go** — gitea: *"do not auto-reactivate disabled users
  on OAuth2 callback"*.

## What it licenses

- **Transfer at scale (RQ4):** the catalog isn't overfit — it generalizes across
  domain and language. New projects start from the dictionary, not from zero.
- **The FE/BE split holds and sharpens:** backend-heavy apps (mastodon, gitea,
  bitwarden) are dominated by second-order-effects, integration-integrity and
  authorization — exactly the **Assay.NET / backend-adapter** territory (~40% of the
  chaos, now confirmed in three more backends). Frontend-heavy surfaces lead with
  navigation, projection and i18n — Assay's domain.
- **It motivates a Rails/Go/Laravel adapter the same way the data motivated
  Assay.NET:** the HTTP-observable archetypes (authz, idempotency, webhook
  signature, notify) are language-neutral — one HTTP adapter could verify them
  against any of these backends.

## Honest ledger

- **Lower bound, not census.** Tier-1 leaves 85–92% unclassified; the real counts
  are higher. The classified slice is already decisive, but it under-counts.
- **Tier-1 has false positives.** `data-honesty` here is mostly *test* fixtures, not
  shipped fake data; some `second-order-effects` rows are CSS fixes that mention
  "email". Treat rows as leads, the distribution as evidence.
- **Classified ≠ executed.** These are tier-1 *labels*, not faithful repros. The
  executed benchmark (the proof) still grows by hand from the best pairs — next, a
  cross-stack repro (e.g. the bitwarden IDOR via an HTTP adapter) would be the first
  executed backend transfer datapoint.
