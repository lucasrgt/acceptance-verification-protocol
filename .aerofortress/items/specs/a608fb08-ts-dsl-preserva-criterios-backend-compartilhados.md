---
id: a608fb08-403e-4889-9807-5c7601034390
slug: specs
type: fact
title: TS DSL preserva criterios backend compartilhados no protocolo AVP
tags: assay-cycle, protocol-sync, assay.net, catalog
provenance: observado
evidence: C:\Users\lucas\dev\avp\assay\src\protocol.ts; C:\Users\lucas\dev\avp\docs\catalog.md
decay: stable
created: 2026-07-01T05:44:26.008475600+00:00
updated: 2026-07-01T05:44:26.008475600+00:00
validated: 2026-07-01T05:44:26.008475600+00:00
links: 
---

Durante a iteração assay-cycle de 2026-07-01, o baseline `npx vitest run` revelou que `protocol-sync` apagaria critérios backend/.NET do `protocol/catalog.json` porque eles existiam apenas no protocolo gerado por Assay.NET. A correção foi exportar os arquétipos `access-control`, `credential-authority`, `token-rotation`, `resource-uniqueness` e `submission-gate` também no DSL TypeScript, mantendo-os como catálogo compartilhado enquanto só critérios com repro Node/HTTP fiel entram no ledger runtime JS.
