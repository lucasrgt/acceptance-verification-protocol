---
id: 655891ed-5123-42b0-ab10-611f34d49d73
slug: arch
type: decision
title: Revisão externa (GPT + 2º Claude): o que adotar e rejeitar
tags: arch, revisao, persona-visibility, prior-art, quickstrom, tese, avp
provenance: importado
evidence: 
decay: seasonal
created: 2026-06-20T03:54:23.388279300+00:00
updated: 2026-06-20T03:54:23.388279300+00:00
validated: 2026-06-20T03:54:23.388279300+00:00
links: 
---

Três análises independentes (GPT, 2º Claude, nós) convergiram no mesmo core (problema do oráculo, fabricar oráculos, corpus-first, escape→invariante, arquétipos, benchmark como contribuição, transferibilidade) → forte sinal de que a direção é REAL.

ADOTAR (deltas úteis):
- **persona-scoped-visibility** como arquétipo herói/transferência: mais universal (marketplace/SaaS/CRM/fintech), naturalmente INVARIANTE ("ator incompatível não vê/aciona entidade"), mais declarativo (logo mais portável pro protocolo), é a mochileira (o caso canônico "teste passou, produto errado"). Exige estender subject com ATORES + DIMENSÕES DE ESTADO. Usar como teste de TRANSFERÊNCIA (RQ4) depois da curva do action-effect.
- **Critérios como INVARIANTES, não checks-de-exemplo** (conteúdo real do alerta "não construa checklist engine").
- **Prior art (estudar, posicionar):** Quickstrom (PBT+lógica temporal p/ aceitação web — vizinho mais próximo; achou bug em ~metade dos TodoMVC) é tarefa de casa; fast-check (PBT, substrato pro eixo de condition de DADOS que falta); axe-core (arquétipo a11y); OpenTelemetry (observar efeito cross-tier → cluster backend de 2ª ordem).
- **Enquadramento de tese + RQs** (espinha de rigor; não precisa de universidade): RQ1 o que escapa · RQ2 quanto vira invariante · RQ3 detecta regressões históricas · RQ4 transfere entre projetos. Já geramos dado de RQ1/RQ3 (corpus).

REJEITAR/CUIDAR:
- A catedral de 5 camadas + 7 adapters + DSL/runtime/agents = inflação de escopo (contradiz o próprio aviso dele + ADR 0001). Adapter entra quando o DADO exige (backend já justificado). Não construir o diagrama inteiro na frente.
- "Não construa checklist engine" é falsa dicotomia — catálogo curado de invariantes vindo de escapes É a contribuição.
- Ele trata como greenfield; ignora o motor + corpus já feitos.
- Não renomear (AVP/Assay cravado).
