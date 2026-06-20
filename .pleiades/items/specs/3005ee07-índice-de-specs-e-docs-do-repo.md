---
id: 3005ee07-57ff-4a4a-8863-6eb88fc7e984
slug: specs
type: doc
title: Índice de specs e docs do repo
tags: specs, docs, adr, avp
provenance: observado
evidence: Arquivos em C:\Users\lucas\dev\avp\docs\ e bench\corpus.md, CONTEXT.md
decay: stable
created: 2026-06-20T03:53:51.796463500+00:00
updated: 2026-06-20T03:53:51.796463500+00:00
validated: 2026-06-20T03:53:51.796463500+00:00
links: 
---

Curadoria que viaja no repo (espelhada aqui na rede):

- **`docs/adr/0001-thin-layer-not-a-framework.md`** — ADR 0001: AVP fica camada fina, não framework. Descreve specs, observa o app (não gera). Ride o substrato; sem runner/config/plugin/compilador próprios. Smell test: PR que adiciona infra em vez de critério = parar. Non-goals: runner, codegen, config, query language, scaffolder.
- **`docs/genesis.md`** — por que action-effect é o 1º arquétipo: error analysis de 150 commits de fix de um app real de turismo. Distribuição de falhas; achado citável "fixture/mock vazando pra prod = falha específica de software-LLM". A constelação completa (10 critérios documentados) é o roadmap do arquétipo.
- **`docs/doctor-coverage.md`** — spec da regra estática `assay/require-verification` (cobrança de PRESENÇA/COBERTURA de verificação), que mora no doctor da lazuli-net, NÃO num doctor próprio do Assay. Decisão completa na rede da **lazuli-net** (mount), item "Doctor da lazuli-net ganha regra de cobertura Assay".
- **`bench/corpus.md`** — corpus do benchmark: 31 escapes action-effect reais classificados por alcance (FE/BE) e cobertura.
- **`CONTEXT.md`** — glossário formal (o vocabulário do protocolo AVP).

Regra (CLAUDE.md-style): spec/ADR/doc criado ou alterado → atualizar/criar o item espelho aqui (slug specs, resumo + path).
