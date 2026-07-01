---
id: 2756c3c7-9709-40c0-9f0c-26b060dd1854
slug: specs
type: decision
title: ADR 0002 — Custom criteria: bring-your-own, off-catalog
tags: adr, extensibility, custom-criteria, escape-hatch, assay
provenance: dito
evidence: docs/adr/0002-custom-criteria-bring-your-own-off-catalog.md; assay/src/adapter-react/verify.ts (VerifyOptions.hooks); assay/src/adapter-http/verify.ts (VerifyHttpOptions); assay/src/adapter-react/vitest.ts; assay/test/custom-criterion.test.ts
decay: stable
created: 2026-06-24T17:14:27.901263900+00:00
updated: 2026-06-24T17:14:27.901263900+00:00
validated: 2026-06-24T17:14:27.901263900+00:00
links: 
---

A engine do Assay já é extensível por construção: `archetype`/`criterion`/`mechanical|model|human` + `runVerification(subject, archetype, hooks)` são públicos (exportados na raiz). Um dev autora um critério de DOMÍNIO no próprio repo com a mesma DSL do catálogo e roda na mesma engine.

**Escape hatch (o gap que faltava era só ergonômico):** as entradas de conveniência `verify` (React), `verifyHttp` e o host Vitest `defineVerification` despachavam por um REGISTRY fechado e lançavam erro em nome de archetype desconhecido. Agora aceitam `{ hooks }` por-chamada — NUNCA um registro global. Se o archetype não está no catálogo, os hooks do caller rodam ele pelo mesmo executor neutro. É exatamente o que `runVerification` já aceita, exposto nas entradas de conveniência → fiel ao ADR 0001 (sem registry/discovery/config/lifecycle).

**Fronteira de duas camadas (o invariante a proteger):** Camada 1 = catálogo grounded (universal, minerado de escapes reais, shippa no pacote, ÚNICO que entra no benchmark de acurácia). Camada 2 = critérios custom (no repo do dev, mesma engine, NUNCA no benchmark). Misturar dilui o grounding que dá credibilidade ao catálogo.

Decisão tomada pelo usuário (escolheu "biblioteca + escape hatch" entre 3 opções). Exemplo calibrado caos→verde em `assay/test/custom-criterion.test.ts` (regra "todo banco expõe o mesmo protocolo de conta"). Veja [[adr-0001-thin-layer]].
