# Contributing

AVP grows by **escape accrual**: every criterion exists because a real defect escaped a
real test suite. That discipline is the contribution bar.

## Adding or changing a criterion

1. **Ground it.** A new criterion needs a real escape (a fix commit in an OSS repo or a
   project you can cite). `seenIn` carries the refs.
2. **Calibrate it.** Ship the (good, bad) repro pair and a bench proving the verifier
   FAILS the bad and PASSES the good (see `assay/bench/harness.ts` — `pairAccuracy`).
   Detection without false alarms is the merge gate.
3. **Regenerate the protocol.** `ASSAY_WRITE_PROTOCOL=1 npx vitest run protocol-sync`
   (from `assay/`) — the committed catalogs must match the shipped archetypes, and the
   .NET suite must stay green against the new catalog.

## Ground rules

- Thin layer, not a framework (ADR 0001): no runner, no config file, no plugin system.
- Custom/private criteria stay OFF-catalog (ADR 0002) — the shipped catalog only carries
  escapes that are grounded and calibrated.
- Everything green before a PR: `npx tsc --noEmit && npm run lint && npx vitest run`
  (assay/) and `dotnet test` (assay.net/).
- Repo language is English; keep project references neutral (no client names).

## Releases

One tag `vX.Y.Z` publishes every package at the same version (publish.yml asserts it):
bump `assay/package.json`, `assay/eslint-plugin-assay/package.json`, and
`assay.net/.../Assay.Net.csproj` together, then tag.
