# Assay.NET — the backend adapter (Phase 1 plan)

> **Status:** known backend catalog CLOSED + **PACKAGED** (2026-06-21) — `assay.net/` builds green,
> **28 tests passing**, shipped as the NuGet package **`Assay.Net` 0.1.0** (self-contained: the
> neutral `catalog.json` is embedded, read via `Catalog.LoadDefault()`; XML docs + README ship in the
> package). Generate the feed with `dotnet pack src/Assay.Net -c Release -o local-feed` (gitignored;
> consumers vendor a copy). **11 backend criteria across 7 archetypes**: authorization
> (own-resource-only, role-required, server-is-authoritative), integration-integrity
> (webhook-signature-verified, callback-resolves-entity, redirect-urls-bound),
> second-order-effects (notifies-all-parties), request-idempotency (idempotency-key-honored),
> lifecycle-gate (gate-enforced-server-side), money-integrity (split-invariant),
> pagination-integrity (pages-cover-the-set). Every criterion is calibrated caos→verde
> (passes the correct repro server, FAILS the vulnerable one) over real Kestrel HTTP, and
> dom/frontend criteria are honestly `Skipped` (the JS `assay` adapter's job). Slice 1 +
> waves 1–2 were orchestrated by the `avp-backend-smith` specialist, ~5 in parallel on
> disjoint criteria. Assay.NET was the documented next frontier (~40% of escapes are backend).

## What it is

**Assay.NET is a .NET implementation of AVP** — a sibling to `assay` (the JS/React
reference), not a fork. It implements the **adapter contract** for the substrates a
backend can observe (`http` first, an in-process **native** substrate next),
consuming the language-neutral catalog and emitting portable `Verdict`s.

It is **not** a port of the 34 archetypes. The archetype/criteria *definitions* are
the neutral catalog (`protocol/catalog.json` + `protocol/design-catalog.json`,
generated + drift-guarded). An adapter *binds hooks to a substrate*; `core/run.ts`
already proved the core is substrate-neutral by running `dom` and `http` through one
runner. Assay.NET is the `http`/native sibling of that.

## Invariants (inherited, non-negotiable — see the constitution + ADR 0001)

- **Thin layer, not a framework.** Ride mature substrate: **xUnit** + a real HTTP
  host (e.g. `WebApplicationFactory`/Kestrel or `HttpClient` against a repro server),
  the way `assay` rides Vitest/MSW. No bespoke runner, no IR, **no `assay.config`**.
- **Not a runner addon.** `Verify(...)` returns a portable `Verdict` and runs inside
  any host (xUnit, a console, CI). The adapter binds to the *platform substrate*
  (HTTP / in-process), never to the runner.
- **Honest skips.** A criterion whose seam/oracle is unavailable is `skipped`, never
  silently passed (a false green is the catastrophic error).
- **Standalone.** Assay.NET knows nothing about `aerofortress-framework` or the
  Harness. The dependency is one-way: the Framework → AVP, never the reverse (the
  `[Verify]`/`LZ*` enforcement lives in the Framework, Phase 2).
- Repo language: **English**, neutral (no client names).

## Conformance target (`docs/PROTOCOL.md` §Conformance)

Assay.NET is AVP-conformant for a substrate iff it:
1. consumes the `Specification`s in `protocol/catalog.json` for that substrate;
2. provides `hooks` (`probe` / `applies?` / `gatherEvidence?` / `judge?`) binding
   each catalog archetype's criteria to the substrate;
3. emits `Verdict`s in the protocol shape (`status` + `reason` + `acceptanceScore`);
4. is honest (skip, never false-green).

## Slice 1 — mirror `src/adapter-http/` in .NET

The JS HTTP adapter is the blueprint (see network item `9cec644b`): a registry
`verify.ts` keyed by `archetype.name` → `core/run.ts`, driving backend archetypes
over real `node:http` repro servers. Assay.NET mirrors this pattern:

| Archetype (catalog) | Criterion | Seam |
|---|---|---|
| `authorization` | `own-resource-only` (IDOR), `role-required` | HTTP request as owner/role |
| `integration-integrity` | `webhook-signature-verified` | forged vs valid HMAC |
| `second-order-effects` | `notifies-all-parties` | trigger → assert each party inbox |

Next backend criteria (already named as the frontier): `idempotent-write`
(double-POST same key → one effect), `server-is-authoritative` (client-claimed
privileged value ignored), `callback-resolves-entity`.

## Monorepo layout (polyglot)

Restructure this repo into a polyglot monorepo (do it now — the FE frontier is dry,
no active iteration to break):

```
/  (acceptance-verification-protocol)
├─ protocol/        # catalog.json + design-catalog.json — the neutral source of truth
├─ docs/            # PROTOCOL.md, catalog.md, this plan — shared
├─ assay/           # the JS/React reference (today's repo root moves here)
└─ assay.net/       # the .NET sibling (new)
   conformance/     # asserts assay & assay.net agree on the catalog
```

The root conformance suite is the cross-language drift-guard: both implementations
consume the same `protocol/` catalog; neither may diverge silently.

## The leadership trajectory (.NET leads, without breaking lockstep)

- **Now (Phase 1):** Assay.NET *conforms* to the current catalog (emitted from the JS
  archetypes + drift-guarded). Ships the ~40% backend value fast.
- **Phase 2:** the .NET extraction **refines the protocol** — `PROTOCOL.md`
  §Versioning already anticipates "the Assay.NET extraction is expected to refine the
  Subject-descriptor and adapter contract into their final cross-language form." Then
  catalog generation migrates to .NET; JS conforms. That is how ".NET leads" lands
  without throwing away the lockstep machinery already running.

## Resolved decisions

1. **.NET HTTP substrate:** raw **Kestrel** repro servers (`WebApplication.CreateSlimBuilder`,
   `127.0.0.1:0`) over `HttpClient` — the calibration pair (good/bad backend) is the protocol-level
   test, and a self-hosted Kestrel is the closest honest stand-in for a real backend without coupling
   the package to a host's test harness. See `tests/.../Repro.cs`.
2. **Catalog consumption:** read at **runtime** from the catalog **embedded** in the assembly
   (`Catalog.LoadDefault()`), with `Catalog.Load(path)` for a specific/newer catalog on disk. Chosen
   over build-time codegen: it keeps the package self-contained (no path to the monorepo) and the
   neutral JSON the single source of truth — the adapter reads the contract, never regenerates it.
3. **Naming:** **`Assay.Net`** (PackageId + assembly + namespace) — neutral, standalone, xUnit-like,
   NOT under the `AeroFortress.Framework` namespace. Aligns with the rebrand rule "Assay mantém nome
   Assay"; the npm sibling is `@aerofortress/assay` (the org scope is a JS-registry artifact .NET's
   flat ids don't need).

## Next: consumption (the Clockwork dogfood unblock)

The package now exists in a local feed, so a consumer (the framework's `examples/sample-app` proof
project, or a pilot) can `nuget.config` it and write real `[AVP("id")]` proofs against a slice. The
remaining wiring for the `Withdraw` dogfood: repack the `aerofortress-framework` doctor with `LZ0030`
into its `local-feed`, add the assay.net feed to the sample-app's `nuget.config`, emit
`[Verify]`/`[AVP]` on `Withdraw`, watch the gate go red, implement idempotency, green.
