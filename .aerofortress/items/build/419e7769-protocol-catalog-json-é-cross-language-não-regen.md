---
id: 419e7769-94fc-4e3f-9060-d08dc179c9cc
slug: build
type: scar
title: protocol/catalog.json é cross-language — NÃO regenere pelo lado JS
tags: protocol, catalog, cross-language, assay-net, drift-guard
provenance: observado
evidence: git diff protocol/catalog.json após ASSAY_WRITE_PROTOCOL=1: 84 deleções incl. statements de token-rotation/resource-uniqueness/requires-authentication; assay/bench/protocol-sync.test.ts só usa buildCatalog() JS
decay: stable
created: 2026-06-24T17:14:36.788172+00:00
updated: 2026-06-24T17:14:36.788172+00:00
validated: 2026-06-24T17:14:36.788172+00:00
links: 
---

O teste `assay/bench/protocol-sync.test.ts` (drift guard) constrói o catálogo a partir do `buildCatalog()` JS e compara com `protocol/catalog.json`. Mas o `protocol/catalog.json` é o contrato NEUTRO cross-language: contém também os archetypes do **Assay.Net** (token-rotation, resource-uniqueness, requires-authentication — commits 0.1.3–0.1.7) que o `buildCatalog()` JS NÃO emite.

**Consequência:** rodar `ASSAY_WRITE_PROTOCOL=1 npx vitest run protocol-sync` pelo lado JS APAGA os archetypes do .NET do catálogo compartilhado (observei: regen deletou 84 linhas — definições reais de archetype, não ruído de `seenIn: []`). Destrutivo.

**Como aplicar:** o `protocol-sync` falhar em HEAD é estado pré-existente/esperado enquanto o catálogo neutro tiver archetypes que o lado JS ainda não registra. NUNCA "conserte" esse vermelho regenerando pelo JS. O regen correto precisa combinar as duas fontes (JS + .NET), ou o drift guard JS precisa ser escopado só pros archetypes JS. Antes de sobrescrever um artefato gerado, olhe o que está sendo removido.
