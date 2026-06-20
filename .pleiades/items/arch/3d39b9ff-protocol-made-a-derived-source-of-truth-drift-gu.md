---
id: 3d39b9ff-c32f-4ca4-8b59-5501d5d2224a
slug: arch
type: decision
title: Protocol made a derived source of truth + drift guard (never lags the lib)
tags: arch, protocol, avp, drift-guard, adr-0001, lockstep, decision
provenance: observado
evidence: src/protocol.ts; protocol/catalog.json; bench/protocol-sync.test.ts; docs/PROTOCOL.md; suite 64/64
decay: stable
created: 2026-06-20T15:32:11.003920200+00:00
updated: 2026-06-20T15:32:11.003920200+00:00
validated: 2026-06-20T15:32:11.003920200+00:00
links: 
---

User concern: "the protocol can never fall even 1% behind the lib." Honest diagnosis: the CONCEPTUAL protocol (neutral core src/core + the catalog dict) grew in lockstep by design (neutral-core refactor, DOM+HTTP on one runVerification). The GAP: no FORMAL protocol artifact (a versioned, machine-readable spec an Assay.NET implements against) — deferred per ADR 0001 (extract from 2+ impls).

FIX (structural, not documentation): the protocol is now a DERIVED SOURCE OF TRUTH, guarded.
- src/protocol.ts: ARCHETYPES list + buildCatalog() emits a ProtocolCatalog {protocol, protocolVersion 0.1.0, conditionAxes(fault/data/interaction), oracleKinds, archetypes: spec[]} from the shipped archetypes.
- protocol/catalog.json: the machine-readable portable catalog (generated; 8 archetypes).
- bench/protocol-sync.test.ts: DRIFT GUARD — asserts committed catalog.json == buildCatalog(); add a criterion to the lib without regenerating → suite RED. Regen: `ASSAY_WRITE_PROTOCOL=1 npx vitest run protocol-sync`. (gotcha: import.meta.url isn't file:// in vitest; use resolve(process.cwd(),'protocol/catalog.json')).
- docs/PROTOCOL.md: AVP spec v0.1 — data model, execution model (runVerification + hooks{probe/applies/gatherEvidence/judge}, Probe{act,expect}), catalog refs, conformance, versioning. Extracted from 2 substrates/1 language; .NET extraction will refine.
- assay-cycle loop step 5 now regenerates the protocol artifact (guard makes it non-optional).

NET EFFECT: protocol is structurally incapable of lagging the lib by even one criterion. Suite 64/64, tsc clean. ANSWER to the question: both grow, but now the protocol is the GUARDED source and the lib is its implementation — not the reverse.
