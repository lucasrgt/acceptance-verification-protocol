# Changelog

## Unreleased

### Protocol — the authority handover (Phase 1b closed)

- **The catalog is now .NET-led.** Criteria are born in
  `assay.net/src/Assay.Net/CatalogSource.cs`; the committed `protocol/*.json` artifacts
  are emitted from it by `CatalogEmitter` (canonical bytes: 2-space indent, stable field
  order, LF). Regenerate: `ASSAY_WRITE_PROTOCOL=1 dotnet test --filter CatalogSync`.
  The handover was byte-lossless — zero diff to the committed artifacts.
- **Two-sided lockstep.** .NET: `CatalogSyncTests` (committed == canonical emission +
  lossless model round-trip over the embedded copies). JS: `bench/protocol-sync.test.ts`
  flipped to a CONFORMANCE guard — parsed-content equality, **no write path** — so Assay
  (JS) is now formally the conformant front adapter (`dom`/`style`/`geometry`/`model`),
  mirroring the contract it no longer writes.
- `ProtocolCatalog` (.NET) is lossless at the root too: gained the design catalog's
  `catalog` + `substrates` fields.

## 0.2.0 — 2026-07-01

The audit release: 125 improvement points closed across the whole repo.

### Protocol (0.1.0 → 0.2.0)

- Specs now serialize `requires` (the applicability seam) and a per-archetype `description`.
- `double-activate` documented in the condition vocabulary; custom condition ids are legal
  for off-catalog criteria (ADR 0002).
- Verdicts carry `archetypeVersion`, `protocolVersion`, `applicable`, `passed`, and
  wall-clock durations — a vacuous pass (0 applicable) is now distinguishable.
- Unexpected oracle errors are FAIL verdicts with the error as evidence in BOTH
  implementations (the .NET runner no longer aborts the run).

### Assay (JS)

- New entries: `./judge` (the Claude judge) and `./design/browser` (the geometry tier —
  previously unpublished). RTL/user-event/MSW/puppeteer-core moved to optional peers.
- `defineVerification`'s `threshold` now actually governs the gate.
- One shared `settle()`/`settleUntil()` replaces 26 local timing sleeps; MSW handlers are
  scoped per drive; double-activate is gated deterministically (no timing race).
- HTTP adapter: single wire module with per-request deadlines, structural comparison for
  server-authority, random idempotency keys, before/after inbox deltas, and
  crash-is-not-a-refusal semantics (5xx never passes an authorization criterion).
- Design tier: rgba/hsl/oklch/named-color parsing, alpha-composited contrast, AA/AAA
  levels, injectable token/theme ground truth, opt-in computed-style checking.
- `assay verify` is a real CLI: filters `*.assay.*` files, `--json`, `--help`, no shell.

### Assay.Net (0.1.9 → 0.2.0)

- Lossless catalog model (`requires`/`seenIn`/`params`/`conditionAxes`/`description`),
  embedded design catalog (`Catalog.LoadDesignDefault`), `Verdict.Merge`,
  `SpecManifest.MissingFrom`, `Format.Verdict`, client timeouts, custom `rejectWith`,
  cancellation + progress hooks on `Runner.Run`.

### Infra

- New `ci.yml` (tsc + eslint + bench + example + dotnet, every push/PR); publish is gated
  on tests and a tag==version assertion, with npm provenance and SHA-pinned actions.
- Accuracy datapoints persist via `ASSAY_RECORD=1`; `tools/measure/measure.mjs` appends
  the convergence table (`docs/measurements.md`).
