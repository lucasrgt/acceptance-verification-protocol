# ADR 0002 — Custom criteria: bring-your-own, off-catalog

## Status
Accepted (2026-06-24)

## Context
Assay ships a **first-party catalog** of archetypes, each grounded in a real OSS escape and
held to a calibrated accuracy benchmark (detection + zero false alarm). But a consumer often
has a **domain invariant** the catalog can't cover — e.g. a multi-bank SaaS where every bank
integration must expose the same account protocol. Such a rule is a private business invariant:
not mineable from OSS, specific to one product, and the dev — not the catalog — decides it exists.

The question: can a dev verify their own criteria, and how, without turning Assay into the
framework ADR 0001 forbids (a config system, a plugin registry, a lifecycle)?

## Decision
**Authoring custom criteria already works — it is the same public DSL the catalog uses.**
`archetype` / `criterion` / `mechanical|model|human` and the neutral executor
`runVerification(subjectName, archetype, hooks)` are all exported from the package root. A dev
authors an archetype in their own repo, writes a `Probe` + `VerifyHooks` for it, and runs it.
Nothing new is needed to *author* or *run* an off-catalog criterion.

The only gap was ergonomic: the adapter convenience entries (`verify`, `verifyHttp`) and the
Vitest host (`defineVerification`) **dispatch by a closed catalog registry** and threw on an
unknown archetype name — so a custom criterion lost the nice host (gating + formatted verdict).
We close it with a **per-call escape hatch**, not a registry:

- `verify(archetype, subject, { hooks })`, `verifyHttp(archetype, subject, { hooks })`,
  `defineVerification(archetype, subject, { hooks })`, and — since 0.2.0 — the design tiers
  (`verifyDesign(..., { hooks })`, `verifyDesignBrowser(..., page, { hooks })`) accept
  caller-provided hooks. When the archetype isn't in the catalog registry, those hooks run
  it — through the *same* neutral executor and verdict as a catalog archetype.
- This is exactly what `runVerification` already accepts, surfaced on the convenience entries.
  It is **per-call**, never a global registration — so custom criteria stay in the dev's repo.

**The two-layer boundary (the invariant to protect):**
- **Layer 1 — the grounded catalog**: universal, mined from real escapes, shipped in the package,
  and the *only* thing that enters the accuracy benchmark. Its credibility is the grounding.
- **Layer 2 — custom criteria**: authored by the dev, in the dev's repo, same engine, **never**
  in the package's benchmark. Mixing the two would dilute exactly what gives the catalog its value.

## Consequences
- A dev verifies a domain rule with the full Assay loop (conditions, oracles, actionable verdict,
  caos→verde calibration) — see `test/custom-criterion.test.ts` for the worked example.
- The catalog's grounding and accuracy benchmark stay uncontaminated by private rules.
- The escape hatch doubles as proof the core is genuinely substrate- and archetype-neutral.

## Why this is not the framework ADR 0001 forbids
The hatch is the caller handing the executor its hooks **inline, per call** — the same shape
`runVerification` already has. There is no global registry to populate, no discovery, no plugin
lifecycle, no config file. It is "grow the surface escape-driven; the host is a thin wrapper over
the executor `verify`." The drift alarm (a registry/lifecycle/config for custom criteria) stays armed:
if we ever feel the urge to auto-discover a folder of "project archetypes," that is the line.

## Non-goals
A custom-archetype registry or auto-discovery, a `*.criteria` config, or any path that lets a
custom criterion enter the first-party accuracy benchmark.
