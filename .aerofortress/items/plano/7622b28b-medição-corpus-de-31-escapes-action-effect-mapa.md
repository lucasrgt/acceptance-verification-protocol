---
id: 7622b28b-b689-4b7a-bd70-59ead1f8bb05
slug: plano
type: fact
title: Medição — corpus de 31 escapes action-effect + mapa de cobertura
tags: medicao, benchmark, corpus, cobertura, convergencia, action-effect, assay-net
provenance: observado
evidence: bench/corpus.md; lib 10/10 (detection 3/3, false-alarm 0/3); commit projections-converge
decay: seasonal
created: 2026-06-20T03:54:10.620809600+00:00
updated: 2026-06-20T04:03:52.437247+00:00
validated: 2026-06-20T04:03:52.437247+00:00
links: 
---

Medição do core (corpus real). 31 escapes action-effect minerados do histórico git de um app real de turismo full-stack (~55 outros descartados). Cada um = par rotulado (pre-fix=ruim, post-fix=bom). Corpus + mapa em `bench/corpus.md` (anonimizado, hashes opacos).

MAPA DE COBERTURA (classificação por alcance/critério; recall executado vem dos repros):
- **Cobertos (FE): ~9/31 (~29%)** — no-op (fires-primary-effect), phantom-success de UI (no-phantom-success), erro genérico (error-is-specific), e **projeção (projections-converge — recém-implementado, +2: b9659b46, 5a0f2acb)**.
- **FE precisa critério novo: ~9** — no-fixture-data (3) lidera, depois optimistic-reconcile (c987e087), cache-cleared-on-identity (4d7ec748), role-correct-call (fd1493e7), request-accepted (c1849234), idempotent-retry (0188869f), survives-token-refresh (b4b0fc07).
- **Backend-only → Assay.NET: ~13/31 (~42%)** — entrega de notificação, webhook/preference, IDOR/authz, lifecycle gate, typed conflict. O adapter React NÃO vê.

CURVA DE CONVERGÊNCIA (1º datapoint): implementar `projections-converge` moveu detecção do benchmark 2/2 → 3/3 e cobertura do corpus ~7 → ~9. É a afirmação científica em ação: critério vindo de falha real → contagem sobe contra corpus fixo.

ACHADOS: (1) ~42% do caos é BACKEND → justifica Assay.NET. (2) Teto do adapter React ≈ 18/31; próximo maior ganho FE = no-fixture-data (3). (3) Mecanismo real, cobertura crescente, caminho mapeado por dado. PRÓXIMO critério FE: no-fixture-data (precisa cruzar dado renderizado vs backend).
