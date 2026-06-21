---
id: ae56a252-0d04-4b8d-9ed3-216cd75ac2ce
slug: catalog
type: project
title: Loop assay-cycle (2026-06-20) — step-3 new-domain mining COMPLETE; stop condition met
tags: 
provenance: observado
evidence: commits e5a1c99..32abebf; full suite 36 files/149 tests green at iter 7; detection 39/39 across 14 archetypes; mining sweep iter 8 came up dry across cal.com/documenso/firefly-iii/bitwarden
decay: stable
created: 2026-06-20T18:42:58.104517300+00:00
updated: 2026-06-20T18:42:58.104517300+00:00
validated: 2026-06-20T18:42:58.104517300+00:00
links: 
---

**STOP DECISION (loop assay-cycle, user's step 3 = "mine new domains").** After 7 productive iterations the iteration-8 mining+selection sweep came up DRY → loop stop condition met ("uma rodada de mineração+seleção não acha mais critério de alto valor não-coberto com adapter disponível").

**Harvest this loop (7 new criteria executed, all caos→verde + mutation families, all pushed clean to public origin/main):**
1. temporal-integrity · zoned-to-user (cal.com, NEW archetype)
2. temporal-integrity · floating-date-not-shifted (cal.com 26e85823)
3. action-effect · single-flight (double-submit; new double-activate condition)
4. pagination-integrity · pages-cover-the-set (NEW archetype)
5. render-resilience · survives-malformed-data (NEW archetype; cal.com 44 crash fixes)
6. money-integrity · amount-rendered-exact (firefly-iii; money-integrity now cross-substrate)
7. request-idempotency · idempotency-key-honored (NEW archetype, BE/HTTP; single-flight's server twin)

→ **4 new archetypes** (temporal, pagination, render-resilience, request-idempotency) + 2 cross-substrate extensions. Detection 32/32 → **39/39, false-alarm 0, 14 archetypes**. Corpus grew to 8 repos (added cal.com, firefly-iii). docs/catalog.md "Frontier status" section records it.

**Why it stopped (NOT scraping — gold rule):** remaining candidates are gold-rule-blocked (no faithful repro in the mined corpora: clock-not-frozen, lost-update/optimistic-concurrency, optimistic-rollback-on-error — all checked, all ungrounded → did NOT mold), below the acceptance bar (rate-limiting, CSRF/XSS = abuse/security, not "does the feature work"), or marginal (upload-validation, sort-order, dirty-form). 

**NEXT (user's plan):** step 3 (mine new domains) + step 2 (judge) + step 1 (git) all DONE. The remaining bulk of value is **step 4 = Assay.NET** — the .NET reference backend adapter for the catalogued BE criteria (~40% backend chaos), explicitly OUT of this loop's FE/HTTP scope. New runtime criteria will grow only when a fresh domain or a clean repro surfaces a currently-ungrounded class (clock-not-frozen the most likely). [[0ead4f1a]] [[38cf53fa]]
