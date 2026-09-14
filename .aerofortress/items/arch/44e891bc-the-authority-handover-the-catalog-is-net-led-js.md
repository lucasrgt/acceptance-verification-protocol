---
id: 44e891bc-28f4-433e-8633-c8e3ca911240
slug: arch
type: fact
title: The authority handover — the catalog is .NET-led; JS is the conformant front adapter (Phase 1b closed)
tags: protocol, authority, catalog, phase-1b, handover, conformance
provenance: observado
evidence: assay.net/src/Assay.Net/CatalogSource.cs; assay.net/src/Assay.Net/CatalogEmitter.cs; assay/bench/protocol-sync.test.ts; commit 2c877a5
decay: stable
created: 2026-07-03T00:58:36.101972200+00:00
updated: 2026-07-03T00:58:36.101972200+00:00
validated: 2026-07-03T00:58:36.101972200+00:00
links: 
---

Shipped `2c877a5` (2026-07-02), byte-lossless (zero diff to the committed artifacts at the switch):

- **CatalogSource.cs** — the typed .NET source of BOTH neutral catalogs (39 archetypes / 92 criteria). Criteria are born here now; the file was generated ONCE from the artifacts at handover and is the source since (never regenerate it from JSON — that inverts the authority).
- **CatalogEmitter.cs** — the canonical writer (2-space indent, stable field order per record, LF, trailing newline; `JsonWriterOptions.NewLine="\n"` + UnsafeRelaxedJsonEscaping match `JSON.stringify(x, null, 2)` byte for byte). Condition `params` deliberately throws until a criterion uses them (field-order decision pending).
- **CatalogSyncTests** — committed == canonical emission (byte-exact, CRLF-normalized read for autocrlf checkouts) + lossless model round-trip over the embedded package copies. Regenerate: `ASSAY_WRITE_PROTOCOL=1 dotnet test --filter CatalogSync`.
- **JS flip** — `bench/protocol-sync.test.ts` is now a CONFORMANCE guard: parsed-content equality, write path REMOVED. Assay JS = the conformant front adapter (dom/style/geometry/model), Phase 1b's acceptance.
- `ProtocolCatalog` gained the design root fields (`catalog` via JsonPropertyName + `substrates`) — lossless at the root.
- PROTOCOL.md/README/CHANGELOG updated to the new custody. Verified: dotnet 51/51, tsc, eslint, conformance; CI run 28630971191 green on push.
