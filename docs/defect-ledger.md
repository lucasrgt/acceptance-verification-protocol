# Defect ledger — the flywheel's input

> Real failures that escaped into the pilots, mined from fix-commits and scars, classified into
> recurring **classes**. The class — never the single case — is what can become a catalog
> archetype. The decisive field per class is **AVP candidate**: *covered-but-escaped* means the
> catalog already has the archetype and the escape shows where it must harden or bind deeper;
> *no coverage* means a proposed new archetype (name + criterion + signal). Converting candidates
> into `protocol/catalog.json` + adapter oracles is deliberate, separate work — this ledger is the
> input, never auto-applied.
>
> Maintained by the `defect-collector` routine (dev workspace). Harvest window ~90 days; pilots
> discovered by `*.spec.toml`: pauta-web-monorepo, hostpoint-monorepo, fluxoterra-monorepo, and the
> framework's sample-app. Evidence is `repo@sha` / network scar ids — nothing here is invented.

## First harvest — 2026-07-02

### 1. Authorization scope missing (act beyond the caller's own resources)

- **Occurrences:** hostpoint@1db3c2fd (UpdateHost not scoped to the caller's host),
  hostpoint@d0f1d0c8 (account row not bound to the host's real document), hostpoint@085a5c20
  (operator audit + owned-asset binding; session org by membership), hostpoint@ab63c1e6
  (asset upload owned-binding guard), pauta@d2373ab (activity assignment not scoped to the job's
  members), pauta@fc51908 (attendant resolved without the tenant filter).
- **Root-cause pattern:** the handler trusts an id from the request without pinning it to the
  authenticated principal's ownership/tenancy; the check exists on sibling slices but not this one.
- **AVP candidate:** **covered-but-escaped.** `authorization` (`own-resource-only`,
  `server-is-authoritative`) is in the catalog with a runnable .NET archetype. The escapes happened
  on slices that never *declared* the criterion — the repo-wide representative binding proves the
  mechanism once, not each surface. Harden by **declaring per-slice** on every mutation that takes
  a foreign id (the `af g slice --verify` path makes this cheap at birth) and deepening the pilots'
  manifests (the hostpoint deep-pass board already recommends exactly this).

### 2. Silent failure / phantom success

- **Occurrences:** pauta@381187c (failed supplier send reported as success), pauta@b831091
  (Resend error body swallowed — undiagnosable send failures), hostpoint@6c6579f1 (consent write
  failure swallowed instead of re-armed), hostpoint@4b5f4230 (property save failed silently),
  hostpoint@2a2c7f4d (three client-reported service regressions pinned by tests after the fact).
- **Root-cause pattern:** a failure path returns/renders as if the action succeeded — the error is
  caught and dropped, or the UI never surfaces the mutation's error state.
- **Resolution (0.4.0):** **covered and runnable in both HTTP adapters.** `failure-honesty`
  (`dependency-failure-is-admitted`) forces the dependency-failure scenario and requires a
  non-success response or the subject's declared error envelope. JS and .NET each calibrate
  good/bad repro servers; a swallowed dependency error is now a deterministic red.

### 3. Second-order effect (notification) missing

- **Occurrences:** hostpoint@81c919ed (notify BOTH parties on every booking transition),
  hostpoint@fd1493e7 (new-request notifications not live/actionable), hostpoint@fbc56236 (no
  notification on new message), pauta@fc51908 (decision email's recipient resolution broken).
- **Root-cause pattern:** the primary effect lands, the counterpart's notification is forgotten on
  SOME transitions — the matrix of (transition × recipient) is maintained by memory.
- **Resolution:** **covered with a state-based signal.** `second-order-effects`
  (`notifies-all-parties`) drives the real transition and reads every declared party inbox after
  it. Both reference adapters compare observable post-transition state; the repro servers only
  calibrate the oracle and are not the consumer binding.

### 4. Lifecycle / submission gating not enforced server-side

- **Occurrences:** hostpoint@fbd99841 (going-live not gated on completed lifecycle),
  hostpoint@4330c057 (traveler map showed non-bookable listings), hostpoint@982b95bb (the inverse:
  gate too strict — promotions blocked pre-live), scar hostpoint/7dbad6cb (body-gate lacunas in
  RequestService/CreateCheckoutPreference, later closed).
- **Root-cause pattern:** the FE hides the button but the server accepts the mutation (or a
  projection ignores the lifecycle) — the gate lives client-side only.
- **AVP candidate:** **covered — bind deeper.** `lifecycle-gate` + `submission-gate` (incl. the
  body-target variant minted from these pilots) are runnable. The escapes predate their per-slice
  binding; the standing recommendation is declaring them on every transition slice (hostpoint's
  Operations ×6) rather than new mechanism.

### 5. Persona / role isolation leak (two-apps builds)

- **Occurrences:** hostpoint@28670a98 (absolute persona isolation wave), hostpoint@1e6ba089
  (persona leak on shared routes), hostpoint@e768c8ad (role-fixed build accepted the opposite
  persona), hostpoint@311e9504 (persona hardcoded), hostpoint@f0d10d51 (unrecognized
  EXPO_PUBLIC_APP_ROLE built silently).
- **Root-cause pattern:** a single codebase shipping N personas relies on scattered guards; one
  ungated route/system surface mounts the opposite persona.
- **Resolution (0.4.0):** **covered by the hardened existing archetype, without a duplicate.**
  `persona-scoped-visibility/no-cross-persona-route` now accepts the complete declared foreign
  route set and sweeps it against one fixed actor/build. Its mutation family includes the subtle
  case where one representative route is guarded but a sibling route still mounts the opposite
  shell.

### 6. Concurrency / atomicity of multi-write mutations

- **Occurrences:** pauta@b00c9c4 (job + members created non-atomically — ADR 0008),
  pauta@f85820f (public read stamp raced on concurrency conflicts), hostpoint@c0a0c63c (draft row
  reused across a category change), scar fluxoterra/1b479706 (modeled optimistic-concurrency token
  not enforced — silent last-write-wins).
- **Root-cause pattern:** a mutation spanning several writes (or a token-carrying update) is not
  transactional/guarded; interleaving loses one side silently.
- **Resolution (0.4.0):** **implemented in JS and .NET as `mutation-atomicity`.** Criteria:
  `concurrent-conflict-surfaces` (two conflicting updates with the same token: exactly one wins,
  the loser gets a visible conflict — never both 2xx with last-write-wins) and
  `multi-write-is-atomic` (force a failure mid-mutation; assert no partial state is observable).
  Both criteria have real HTTP caos→verde calibration. This complements static transaction
  posture with runtime proof rather than trusting an annotation.

### 7. Integration / webhook state contract

- **Occurrences:** hostpoint@53fcf804 (charge id missing on the webhook notification URL),
  hostpoint@596f1594 (checkout preference without back_urls), hostpoint@0d8d81d5 (OAuth url not
  opened on connect), scar avp/8d6169d0 (gate oracles are path-discriminated; webhook flows that
  answer 200-always can't bind `webhook-signature-verified` honestly).
- **Root-cause pattern:** the contract with the provider is wider than the signature — ids/urls
  threaded through the round-trip, and the real invariant is the STATE the webhook leaves behind,
  not the response code.
- **Resolution (0.4.0):** **`integration-integrity/webhook-effects-state` implemented in JS and
  .NET.** The oracle snapshots domain state, delivers distinct authentic and forged events, then
  requires a +1 authentic delta and zero forged delta. Its calibration deliberately uses
  200-always handlers, proving response status is not being mistaken for the business effect.

### 8. Hand-rolled twin of a shipped primitive (package-first drift)

- **Occurrences:** pauta@6128cf9 + fluxoterra@453460c (the SAME fix in two repos: error code read
  by hand instead of the spine's `apiErrorCode`), hostpoint@11de28da (hand-rolled safeBack +
  api-error bridge), scar pauta/5c987c72 (TestDatabase reimplemented inline).
- **Root-cause pattern:** a spine/framework primitive exists; the pilot re-implements it inline
  and drifts.
- **AVP candidate:** **not an AVP class — graduate to the doctor.** Cross-repo recurrence of the
  same twin is the signal for a new `AFFE`/framework-sync leg (the conformance loop's criterion 4).
  Tracked here so the recurrence count is visible; route to `aerofortress-framework`, not the
  catalog.

### 9. Stale/absent data shape breaks the UI

- **Occurrences:** fluxoterra@c5c44d9 (old snapshot with null buyers broke the analysis screen),
  pauta@b1b4b6c (approvals list crashed on an undefined page), hostpoint@e6c81abe (anonymous /me
  refetch storm froze the boot splash).
- **Root-cause pattern:** data persisted under an older shape (or an empty/anonymous state) reaches
  a view written for the newest shape only.
- **Resolution:** **already covered; no duplicate archetype added.**
  `render-resilience/survives-malformed-data` feeds null nested objects, absent arrays,
  non-string fields, and missing nested metadata to the real render surface. Its mutation family
  kills all four stale-shape crashes while requiring the guarded surface to remain green.

### 10. Test-infrastructure flakiness (watch only)

- **Occurrences:** framework@88838f5 + framework@3e871f9 + framework@fcfb6c1 (testing.postgres
  template clone timeouts / orphaned template self-heal).
- **Verdict:** handled in the framework (Testing.Postgres hardening); not an AVP class. Watched
  because proof-leg flakiness erodes trust in every gate verdict.

---

**Reading the harvest after 0.4.0:** classes 2, 5, 6 and 7 are now executable; classes 3 and 9
were verified as already state/shape based and documented instead of duplicated. Classes 1 and 4
remain binding-depth obligations for the host framework, class 8 routes to the doctor, and class
10 stays with test infrastructure. No open runtime candidate is hidden in this harvest.
