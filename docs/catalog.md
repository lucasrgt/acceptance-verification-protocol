# The criteria catalog — the dictionary

> This is the contribution. Not a runner, not a framework: a **curated catalog of
> acceptance invariants**, each one mined from a real failure that escaped a
> generation-grade test suite. The catalog is the answer to "what does *done*
> mean?" — expressed as criteria a verifier can decide, not as a checklist a human
> eyeballs.

## How this catalog was built

By error analysis, not taste. The source is the full git history (~480 commits) of
a real-world tourism marketplace — a two-persona (traveler / host) + operator
full-stack product (a .NET modular monolith backend + a React-Native / RN-web
frontend), mostly LLM-built over a few weeks under a strong test + review harness.

Every **fix commit is a labelled escape**: a bug that the suite, the journeys, and
review all let through to a later remediation. We read the fix commits, grouped
them by failure shape, and each recurring shape became an **archetype**; each
distinct way the shape fails became a **criterion**. Frequency ranks them: the
archetypes at the top are *what broke the most*.

A criterion earns its place only if (a) it recurred, and (b) it is an **invariant**
— a property that must hold over all states of the feature — not an example check.
"The refund button calls `/refund`" is an example; "every primary action fires its
real effect" is the invariant the example is one instance of.

## Reach — who can observe it

- **FE** — observable by a frontend adapter through the DOM, the network, or
  component state. Runnable today by **Assay** (the React reference adapter).
- **BE** — backend-only behaviour (authorization, delivery, persistence,
  signatures, money math at rest). The frontend adapter *cannot see it*; it is
  bound to a backend adapter (**Assay.NET**, future) or an HTTP adapter.
- **STATIC** — best caught before runtime, by static analysis. These belong in the
  host project's linter/doctor (in this codebase's case, the Lazuli `LZ*`/`LZFE*`
  doctor), **not** in Assay. Listed here for completeness of the dictionary.

## Oracle — what decides it

- **mechanical** — a deterministic script. Green-or-red, no judgement.
- **model** — an LLM-as-judge against a rubric (probabilistic; injectable).
- **human** — queued for a person.
- **static** — an AST rule (for STATIC-reach criteria).

---

## The archetypes, ranked by escape frequency

### 1. `navigation-integrity` — every affordance leads somewhere real *(FE)*

The single largest escape class. An action navigates, but the destination is wrong,
unregistered, or unreachable — the test "tapped the button" and passed; the user
hit a dead end.

| id | statement | oracle | reach | seen in |
|---|---|---|---|---|
| `target-resolves` | Every navigation affordance targets a **registered** route; no tap lands on not-found. | mechanical | FE | route-to-404 tabs, server-minted routes that drifted |
| `back-has-fallback` | Back is never a dead no-op: with no history (deep link / refresh) it falls back to a real parent. | mechanical | FE | dead "Voltar" on web deep links |
| `no-redirect-loop` | A guard/redirect resolves in finitely many hops; no `replace`-in-effect storm. | mechanical | FE | role-select infinite redirect loop |
| `required-params-guarded` | A route that needs a param redirects (not renders broken) when it is absent. | mechanical | FE | param-less chat thread rendering a ghost |
| `contract-mints-no-routes` | The backend ships a closed **kind**, never a client route string; the FE owns the kind→route map (build-time verified). | static | STATIC | server-minted route string drift |

### 2. `persona-scoped-visibility` — an actor sees and acts only within its role *(FE + BE)*

The canonical "test passed, product wrong": the most universal acceptance invariant
across marketplaces / SaaS / CRM / fintech. The FE half is affordance/route
visibility; the BE half is authorization (below, `authorization`). Chosen as the
**transfer experiment** (does a verifier mined from one project catch the same
class in another?).

| id | statement | oracle | reach | seen in |
|---|---|---|---|---|
| `no-cross-persona-affordance` | Signed in as actor X, no affordance scoped to actor Y is rendered or reachable. | mechanical | FE | persona leak on shared routes; cross-persona buttons in role-fixed builds |
| `no-cross-persona-route` | A route scoped to actor Y refuses actor X at the guard, not only at the splash. | mechanical | FE | opposite-persona dashboard rendering on deep link |
| `chooser-scoped-to-build` | A role-fixed build refuses the role chooser / role switch entirely. | mechanical | FE | choose-role reachable in a single-persona build |

### 3. `action-effect` — an action produces its real effect *(FE)*

The hero archetype (see `docs/genesis.md`). An action must reach the world, and on
failure must tell the truth.

| id | statement | oracle | reach | seen in |
|---|---|---|---|---|
| `fires-primary-effect` | The action fires its primary effect; no visible action is a no-op. | mechanical | FE | refund wired-but-not-connected; dead logout; dead resend |
| `no-phantom-success` | On failure, the input persists and an error is visible — never a phantom success. | mechanical | FE | chat silently drops a failed send; silent property save |
| `error-is-specific` | On failure, the error names the real problem and a next step — not "something went wrong". | model | FE | generic checkout error swallowing the backend reason |
| `request-accepted` | The request the FE sends is well-formed enough for the backend to accept it. | mechanical | FE | birthDate sent as datetime to a date-only field → 400 |
| `idempotent-retry` | A retry after a partial failure does not duplicate the effect. | mechanical | FE | service-create retry leaking a duplicate draft per attempt |
| `single-flight` | A fast double-activation fires the effect once, not twice — a primary action guards itself in flight (disables on submit). No failure involved, only click concurrency. | mechanical | FE | double bookings on a seated event; submit fired twice with no loading guard |
| `survives-token-refresh` | An expired token mid-action recovers via refresh instead of erroring the user. | mechanical | FE | idle tab 401s instead of refreshing |
| `projections-converge` | After a successful mutation, sibling projections (lists, badges, counts) reflect it without a reload. | mechanical | FE | stale badges/lists across screens |
| `optimistic-reconcile` | An optimistic update reconciles to the server truth (no permanent drift on count-based UIs). | mechanical | FE | count-based optimistic state never reconciled |
| `cache-cleared-on-identity` | Signing in/out wipes the prior identity's cached rows — they never feed the next session's guards. | mechanical | FE | a prior account's rows feeding the new session |

### 4. `lifecycle-gate` — a transition is gated on its real preconditions *(FE + BE)*

| id | statement | oracle | reach | seen in |
|---|---|---|---|---|
| `gate-enforced-server-side` | The server enforces the precondition; the FE gate is a courtesy, not the guard. | mechanical | BE | go-live / publish / complete gated only client-side |
| `blocked-action-is-disabled` | When a precondition is unmet, the FE disables the action and says why — it doesn't let it fail. | mechanical | FE | publishing offered on an incomplete listing |

### 5. `integration-integrity` — external callbacks are verified and resolved *(BE)*

Bound to Assay.NET / an HTTP adapter — the frontend cannot observe a webhook.

| id | statement | oracle | reach | seen in |
|---|---|---|---|---|
| `webhook-signature-verified` | An inbound webhook with a forged/absent signature is rejected; only authentic callbacks mutate state. | mechanical | BE | unverified payment webhook could approve a charge |
| `callback-resolves-entity` | The callback carries enough to resolve the domain entity it concerns (the charge/order id). | mechanical | BE | webhook arriving without the charge id |
| `redirect-urls-bound` | OAuth / checkout return URLs are bound to the real environment, not a placeholder. | mechanical | BE | missing `back_urls`; wrong OAuth redirect |

### 6. `second-order-effects` — a transition fires *all* its downstream effects *(BE)*

| id | statement | oracle | reach | seen in |
|---|---|---|---|---|
| `notifies-all-parties` | Every state transition notifies every party it concerns (both sides of a booking, both sides of a message). | mechanical | BE | transitions that notified one party or none |

### 7. `authorization` — a caller acts only on resources it owns *(BE)*

The backend half of `persona-scoped-visibility`. IDOR is the recurring shape.

| id | statement | oracle | reach | seen in |
|---|---|---|---|---|
| `own-resource-only` | A write resolves the target scoped to the caller; another account's id returns not-found, never a cross-account write. | mechanical | BE | `UpdateHost` resolvable by id alone (IDOR) |
| `role-required` | An endpoint enforces the role its operation implies; "any authenticated" is not a policy. | mechanical | BE | list/delete-host open to any signed-in user |
| `server-is-authoritative` | The server records its own truth (published version, price), never the client's word for it. | mechanical | BE | recording the client-sent terms version |

### 8. `data-honesty` — rendered data traces to a real source *(FE)*

Never fixtures, stock imagery, or fabricated content on a real-content surface. The
**LLM-specific** failure: generators love plausible placeholder data, and it ships.

| id | statement | oracle | reach | seen in |
|---|---|---|---|---|
| `no-fixture-fallback` | When the API returns empty, the UI renders the empty state — it never falls back to fixture/demo rows. | mechanical | FE | map/home showing fixture pins on an empty API |
| `no-fabricated-media` | A missing image/avatar renders a neutral placeholder, never a stock photo or a random generated face. | mechanical | FE | Unsplash cover + pravatar reviewer faces |
| `count-matches-source` | The number of items rendered equals the number the API returned. | mechanical | FE | fixture-driven filters excluding/inventing rows |

### 9. `money-integrity` — money is correct at rest and in transit *(BE + FE)*

| id | statement | oracle | reach | seen in |
|---|---|---|---|---|
| `split-invariant` | A money split sums to the whole; the platform/host split is exact to the cent. | mechanical | BE | the 15/85 split proven over HTTP |
| `money-is-typed` | Money is a value object, not a float; serialization is lossless. | static | STATIC | introduction of a `Money` value object |
| `money-formatted-once` | One canonical formatter renders currency; no ad-hoc string math. | static | STATIC | duplicated `formatBrlCents` consolidations |

### 10. `state-completeness` — every async surface has loading / error / empty *(STATIC)*

Already enforced statically by the host project's doctor (`LZFE010`). Listed for
completeness; **not** an Assay runtime criterion — caught cheaper before runtime.

### 11. `i18n-honesty` — copy is translated and parity-complete *(STATIC)*

`LZFE011` (locale parity) + `LZFE014` (no hardcoded copy). Static-doctor territory.

### 12. `temporal-integrity` — time is correct: an instant is shown in the user's zone *(FE + BE)*

A **cross-stack addition** (mined 2026-06-20), not from the marketplace — its time
handling was too simple to surface this. Mined from fresh domains where time *is* the
product: cal.com (scheduling — **114** classified temporal escapes, the 4th-largest
archetype there) and documenso (e-signature). The canonical LLM/test escape: a stored
UTC instant is formatted in UTC / the server's zone / the lazy
`new Date(iso).toISOString().slice(0,10)` instead of the viewer's zone, so a value
near a day boundary renders a day off — the test ran at a fixed instant in a fixed
zone and never saw it. Domain-weighted, not universal (see `docs/corpus-multistack.md`).

| id | statement | oracle | reach | seen in |
|---|---|---|---|---|
| `zoned-to-user` | A displayed instant is rendered in the user's timezone; a UTC timestamp near a day boundary shows the user's local date, not the UTC/server date — no off-by-one. | mechanical | FE | DateRange stored in UTC not user machine; event startTime in UTC; default-to-user-timezone |
| `floating-date-not-shifted` | A date-only value (an expiry date, a birthday — no time, no zone) is displayed as authored, never zone-shifted a day by a `new Date()` / `dayjs.tz()` round-trip. | mechanical | FE | `dayjs.tz(dateStr, tz)`→`dayjs.utc(dateStr)` for booking dates; ISO offset parse on reschedule |
| `clock-not-frozen` | A relative-time / countdown readout reflects the live clock at render, not a value frozen at module-load / build time. | mechanical | FE | *(frontier — catalogued, not yet executed)* |

### 13. `pagination-integrity` — paging yields the whole set, each item once *(FE + BE)*

A **cross-stack addition** (every list app paginates). Distinct from data-honesty's
`count-matches-source` (which checks ONE response): this is the multi-page union
invariant. Mined from cal.com (16 pagination fixes) and documenso (10): "default
pagination on documents list API" (7d257236 — only the first page is ever returned),
"pagination discrepancy" (0488442), cal.com "apply standard pagination to /bookings"
(367e2666).

| id | statement | oracle | reach | seen in |
|---|---|---|---|---|
| `pages-cover-the-set` | Paging the entire list yields every item exactly once: the union of pages equals the full set — no off-by-one drop at a boundary, no overlap that repeats a row, no unstable sort that strands one. | mechanical | FE | default pagination missing (first page only); pagination discrepancy; standard pagination not applied |

---

## The coverage ledger (where each criterion lives)

| reach | archetypes | home |
|---|---|---|
| **FE — Assay runs it** | action-effect, projections (within action-effect), data-honesty, navigation-integrity, persona-scoped-visibility (FE half), lifecycle-gate (FE half), temporal-integrity (zoned-to-user), pagination-integrity | this repo, React adapter |
| **BE — Assay.NET / HTTP adapter** | authorization, integration-integrity, second-order-effects, money-integrity (split), lifecycle-gate (server half) | future backend adapter |
| **STATIC — host doctor** | contract-mints-no-routes, state-completeness, i18n-honesty, money-is-typed, money-formatted-once | the host project's linter (Lazuli `LZ*`/`LZFE*`) |

This three-way split is the thesis in one table: **determinism is layered.** Some
acceptance invariants are cheapest as static rules (the doctor), some need a running
frontend (Assay), some need the backend (Assay.NET). No single tool is the verifier;
the *catalog* is, and it routes each criterion to where it can actually be decided.

## Implementation status (Assay reference adapter)

What's executable today vs catalogued. "Executed" = a faithful repro fails the
criterion and a fix passes it, in `bench/`.

| archetype | criteria executed (green) | benchmark |
|---|---|---|
| action-effect | fires-primary-effect, no-phantom-success, error-is-specific (model), projections-converge, request-accepted, idempotent-retry, single-flight, survives-token-refresh, cache-cleared-on-identity, optimistic-reconcile | `bench/accuracy.test.ts` 3/3 + `bench/action-tail.test.ts` 3/3 + `bench/cache-identity.test.ts` 1/1 + `bench/optimistic-reconcile.test.ts` 1/1 + `bench/double-submit.test.ts` 1/1 + mutation 3/3+3/3+4/4 |
| data-honesty | no-fixture-fallback, no-fabricated-media, no-raw-id-flash, count-matches-source | `bench/data-honesty.test.ts` 2/2 + `bench/data-detail.test.ts` 1/1 + `bench/count-source.test.ts` 1/1 + mutation 4/4 |
| persona-scoped-visibility | no-cross-persona-affordance, no-cross-persona-route | `bench/persona-visibility.test.ts` 2/2 **cross-project** + `bench/persona-route.test.ts` 1/1 + mutation 4/4 |
| navigation-integrity | target-resolves, nested-renders, back-has-fallback, required-params-guarded, no-redirect-loop | `bench/navigation.test.ts` 2/2 **cross-project** + `bench/navigation-nested.test.ts` 1/1 + `bench/navigation-back.test.ts` 1/1 + `bench/navigation-params.test.ts` 1/1 + `bench/redirect-loop.test.ts` 1/1 + mutation 4/4+3/3 |
| mount-stability | settles-without-storm | `bench/mount-stability.test.ts` 1/1 |
| **authorization** (HTTP adapter) | own-resource-only (IDOR), role-required, server-is-authoritative | `bench/authorization.test.ts` 2/2 + `bench/server-authoritative.test.ts` 1/1 + mutation 5/5 |
| **integration-integrity** (HTTP adapter) | webhook-signature-verified, redirect-urls-bound, callback-resolves-entity | `bench/integration.test.ts` 1/1 + `bench/redirect-bound.test.ts` 1/1 + `bench/callback-resolves.test.ts` 1/1 + mutation 6/6+4/4 |
| **second-order-effects** (HTTP adapter) | notifies-all-parties | `bench/second-order.test.ts` 1/1 |
| **money-integrity** (HTTP adapter) | split-invariant | `bench/money-integrity.test.ts` 1/1 + mutation 5/5 |
| **lifecycle-gate** (HTTP + React) | gate-enforced-server-side (HTTP), blocked-action-is-disabled (DOM) | `bench/lifecycle-gate.test.ts` 1/1 + `bench/blocked-action.test.ts` 1/1 + mutation 4/4+4/4 |
| **temporal-integrity** (React) | zoned-to-user, floating-date-not-shifted | `bench/temporal-integrity.test.ts` 1/1 + `bench/floating-date.test.ts` 1/1 + mutation 5/5+4/4 |
| **pagination-integrity** (React) | pages-cover-the-set | `bench/pagination-integrity.test.ts` 1/1 + mutation 4/4 |

Total executed detection: **36/36, false-alarm 0**, across **12 archetypes** and 3
independent projects (see `docs/transfer.md`), now over **two substrates**: the
React/DOM adapter AND an HTTP adapter — both plugging into the same neutral core
runner (`src/core/run.ts`). That backend archetypes (authorization, money math at
rest, lifecycle gating) run through the same runner as the DOM archetypes is the
proof the core is substrate-neutral, not React-shaped. **`lifecycle-gate` is now
executed across BOTH substrates** — its server half (gate-enforced-server-side) over
HTTP and its DOM half (blocked-action-is-disabled) in React — one archetype gated at
both layers, the "determinism is layered" thesis made concrete. `authorization`
(3 criteria), `integration-integrity` (3), `navigation-integrity` (5), `data-honesty`
(4), `persona-scoped-visibility` (2) and `lifecycle-gate` (2, cross-substrate) now
seam-gate multiple criteria — a subject declares only the seams it has, and the rest
are honestly skipped, never failed. Probe substrates so far: RTL+MSW drive ·
render-vs-API · render-as-actor · navigate-spy · mount-and-count · a real mounted
TanStack router · a paint-timing harness · a **real HTTP request** · an
**integer-cent split swept across totals** · a **checkout return-URL binding check** ·
a **client-tamper sweep on a recorded value** · a **param-less route mounted to prove
it redirects, not ghosts** · a **rendered-count-vs-API-count comparison** · a
**direct transition on an unready resource to prove the gate is server-side** · a
**callback with an unresolvable reference, judged by refusal** · a **foreign-actor
route deep-linked as the wrong actor, judged by redirect** · a **blocked action
mounted to prove it's disabled with a reason, not a live click into failure** · a
**guard mounted and its route-load hops counted to prove it settles, not storms** ·
a **sign-out/sign-in switch driven to prove the prior identity's cache is wiped** · a
**count-readout compared to the server's authoritative value after an optimistic bump** ·
a **stored UTC instant rendered and its calendar day compared against the viewer's
zone, deterministic on any CI host** · a **date-only value rendered and checked for a
spurious zone-shift back a day across distinct `Date()`/`dayjs.tz()` round-trips** · a
**control activated twice in quick succession against a slow endpoint, counting
requests to prove it's single-flight** · a **paginated list driven "next" to the end,
its collected ids checked to be the full set, each exactly once**.

The original **marketplace** runtime catalog (FE/DOM + BE/HTTP) is fully executed;
what remains from it is exclusively **STATIC** (host-doctor territory, by design —
cheaper before runtime, not Assay's job): `contract-mints-no-routes`,
`state-completeness`, `i18n-honesty`, `money-is-typed`, `money-formatted-once`.
money-integrity's `split-invariant` runs over HTTP; its other two criteria are STATIC.
**The catalog converges by accumulation of escapes, never proven complete** — and
`temporal-integrity` is the proof: a whole archetype the marketplace mine couldn't
see, surfaced only by mining a fresh domain (cal.com, scheduling). Two criteria are
executed — `zoned-to-user` (an instant takes the viewer's zone) and its sharp opposite
`floating-date-not-shifted` (a date-only value takes NO zone); its frontier
(`clock-not-frozen`) is the next runtime growth — from new mined escape classes, not
from a fixed list.

The neutral core (`src/core/run.ts`) runs every archetype through one runner; each
new archetype/probe is one hooks entry in `src/adapter-react/verify.ts`, and
`navigation-integrity` + `data-honesty` each now dispatch across two probe shapes
behind one archetype — the evidence the core is genuinely substrate-neutral, not
action-effect-shaped.

## What the distribution says

- **~45% of the escapes are FE-observable** and are Assay's domain — navigation,
  persona visibility, action-effect, data-honesty lead.
- **~40% are backend-only** — authorization, integration, second-order effects.
  This empirically justifies **Assay.NET**: no frontend verifier can reach them.
- **~15% are best left static** — already absorbed by the host project's doctor as
  `LZ*`/`LZFE*` rules. Several escapes here *became* doctor rules after the fact
  (e.g. the redirect-loop fix shipped `LZFE015`, the navigation-cast ban is
  `LZFE030`). That organic migration — escape → static rule — is the convergence
  story happening on its own; Assay formalizes the runtime half of it.
