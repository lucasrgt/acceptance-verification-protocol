---
id: 5e18eb08-3b83-46bd-96a1-6d765c4778ce
slug: arch
type: decision
title: Arquitetura, identidade e decisões-chave
tags: arch, avp, assay, decisao, identidade, oraculo, dsl
provenance: inferido
evidence: 
decay: stable
created: 2026-06-20T03:53:40.912376900+00:00
updated: 2026-06-20T03:53:40.912376900+00:00
validated: 2026-06-20T03:53:40.912376900+00:00
links: 
---

**Camadas:** L0 substrato (Vitest/RTL/MSW/axe/LLM) — cavalgado, não construído · L1 core neutro de framework (`src/core`) · L2 adapter (`src/adapter-react`; React primeiro) · L3 verdict (passa/falha + evidência + acceptanceScore). O PROTOCOLO (formatos de spec/adapter/verdict) será EXTRAÍDO de 2 implementações reais (Assay + Assay.NET), não desenhado de cima — lição LSP/SARIF (ADR 0001).

**Identidade (não é addon de runner):** `verify(archetype, subject, {judge?})` é função async que devolve `verdict` (dado portável); roda em Vitest/Jest/node --test/script. O adapter se prende ao SUBSTRATO da plataforma (web = DOM+MSW+RTL), não ao runner. Trocar runner → ok; trocar plataforma → outro adapter, MESMO protocolo. Analogia: Assay:Vitest :: language server:VS Code.

**Oráculo misto:** `mechanical` (script determinístico — verde no benchmark) · `model` (LLM-as-judge; judge INJETÁVEL via opção/env, sem config; sem judge → skipped; testado com stub determinístico) · `human` (enfileirado).

**DSL (estilo Vitest, vocabulário AVP):** `archetype(name,ver,fn)`≈describe · `criterion(id,statement,opts,oracle)`≈it · `mechanical(fn)`/`model(rubric)`/`human(note)`. Açúcar sobre dado serializável; arquétipo é NEUTRO (corpo usa `probe` que o adapter injeta). `defineVerification(archetype,subject,opts)` = forma declarativa sem describe/it. `assay verify` = bin fina (wrapper de vitest). `formatVerdict` = relatório.

**Mapa do repo:** `src/core/{types,dsl,verdict,format}.ts` · `src/adapter-react/{subject,drive,probe,verify,vitest,msw-server,index}.ts` · `src/archetypes/action-effect.ts` · `src/index.ts` (barril) · `bench/{dataset,pairs.ts,accuracy.test.ts,model-oracle.test.ts,corpus.md}` · `examples/todo-app` (React+Node zero-dep, pacote próprio via npm workspaces; um React só) · `docs/{adr/0001,doctor-coverage.md,genesis.md}` · `bin/assay.mjs` · `CONTEXT.md` (glossário formal: subject/criterion/oracle/condition/verdict/adapter/escape, âncora oracle problem Weyuker'82).

**Pegadinha:** 2 cópias de React no exemplo → resolvido por npm workspaces (manter). Repro de benchmark: reproduzir o bug fiel ao DIFF e rodar o arquétipo INTEIRO; nunca moldar pra tripar um critério (anti-auto-engano).
