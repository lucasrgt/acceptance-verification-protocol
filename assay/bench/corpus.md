# Benchmark corpus — action-effect escapes (real, mined)

> This file is the **action-effect slice** of the full dictionary. The complete,
> cross-archetype curated catalog (navigation-integrity, persona-scoped-visibility,
> data-honesty, authorization, …) lives in `docs/catalog.md`. This corpus is the
> executed-benchmark backlog for one archetype; the catalog is the whole map.

Real escapes mined from the git history of a real-world tourism app (full-stack, ~2 weeks old,
mostly LLM-built). Each is a fix commit = a labeled `(pre-fix = bad, post-fix = good)` pair. This
is the backlog the **executed** accuracy benchmark (`bench/`) grows from.

> **Caveat (honesty):** `status` below is a *classification* — which criterion *targets* the
> escape and whether the React adapter can even observe it — **not** an executed verdict. Executed
> recall comes as repros are built and run. Hashes are opaque refs into the source history.

**Reach.** `FE` = observable by the React adapter (DOM / network / state). `BE` = backend-only
behavior (delivery, persistence, authz, signatures) — the React adapter cannot see it; it needs a
backend adapter (Assay.NET).

| # | hash | subtype | reach | status |
|---|---|---|---|---|
| 1 | 615ed1a7 | no-op | FE | covered (fires-primary-effect) |
| 2 | 0d8d81d5 | no-op | FE | covered (fires-primary-effect) |
| 3 | 5da98f36 | no-op (wrong primary CTA) | FE | covered (fires-primary-effect) |
| 4 | 8511b434 | no-op (dead resend) | FE | covered (fires-primary-effect) |
| 5 | 3b86ef09 | phantom-success (no revoke req) | FE | covered (fires-primary-effect) |
| 6 | 04677bf9 | phantom-success (draft) | FE | covered (no-phantom-success) |
| 7 | 0188869f.b | phantom-success (generic error) | FE | covered (error-is-specific, model) |
| 8 | b9659b46 | stale-projection | FE | covered (projections-converge) |
| 9 | 5a0f2acb | stale-projection | FE | covered (projections-converge) |
| 10 | c987e087 | stale-projection (optimistic) | FE | needs criterion: optimistic-reconcile |
| 11 | 4d7ec748 | stale-projection (cache on switch) | FE | needs criterion: cache-cleared-on-identity |
| 12 | 8ec5dae5 | fixture-leak | FE | needs criterion: no-fixture-data |
| 13 | 74f546d1 | fixture-leak | FE | needs criterion: no-fixture-data |
| 14 | dfb23261 | fixture-leak (fabricated media) | FE | needs criterion: no-fixture-data |
| 15 | fd1493e7 | wrong-role-endpoint (FE calls 404) | FE | needs criterion: role-correct-call |
| 16 | c1849234 | request invalid (wire format → 400) | FE | needs criterion: request-accepted |
| 17 | 0188869f.a | non-idempotent-retry | FE | needs criterion: idempotent-retry |
| 18 | b4b0fc07 | phantom-success (token expiry) | FE | needs criterion: survives-token-refresh |
| 19 | 81c919ed | missing-2nd-order-effect (notify) | BE | Assay.NET |
| 20 | fbc56236 | missing-2nd-order-effect (notify) | BE | Assay.NET |
| 21 | b2344ff1 | missing-2nd-order-effect (notify) | BE | Assay.NET |
| 22 | 53fcf804 | webhook unresolved (charge id) | BE | Assay.NET |
| 23 | 596f1594 | checkout pref rejected (back_urls) | BE | Assay.NET |
| 24 | 692d85af | webhook signature unverified | BE | Assay.NET |
| 25 | 1db3c2fd | IDOR (cross-account write) | BE | Assay.NET |
| 26 | ab63c1e6 | IDOR (bind-any-asset) + MIME | BE | Assay.NET |
| 27 | fbd99841 | lifecycle gate missing | BE | Assay.NET |
| 28 | 9c6071c0 | untyped conflict (500) | BE | Assay.NET |
| 29 | 6c6579f1 | swallowed best-effort write | BE | Assay.NET |
| 30 | 5523df59 | client-authoritative version | BE | Assay.NET |

## The coverage map

- **Covered by current criteria (FE): ~9 / 31 (~29%)** — `projections-converge` now implemented
  (+2). The mechanism is real and catches real escapes; coverage is growing against a fixed corpus.
- **FE, needs a criterion not yet built: ~9** — ranked: no-fixture-data (3), then optimistic-reconcile,
  cache-cleared-on-identity, role-correct-call, request-accepted, idempotent-retry,
  survives-token-refresh. This is the React adapter's roadmap.
- **Backend-only → Assay.NET: ~13 / 31 (~42%)** — notification delivery, webhook
  signature/resolution, IDOR/authz, lifecycle gates, typed conflicts. The React adapter
  **cannot observe these**.

## What the data says

1. **Nearly half of action-effect chaos is backend** — this empirically justifies **Assay.NET**.
   No frontend verifier can reach it.
2. **The React adapter's achievable ceiling is ~18/31** (the FE rows). `projections-converge` is
   now built; the next biggest win is **no-fixture-data** (3 escapes).
3. The convergence curve is measurable against this fixed corpus. **First datapoint:** implementing
   `projections-converge` moved benchmark detection 2/2 → 3/3 and corpus coverage ~7 → ~9.
