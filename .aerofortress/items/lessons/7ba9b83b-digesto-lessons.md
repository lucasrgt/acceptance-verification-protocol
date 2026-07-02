---
id: 7ba9b83b-e310-4c54-8a49-66e5a3cd52f9
slug: lessons
type: doc
title: Digesto — lessons
tags: digesto
provenance: observado
evidence: avp/docs/defect-ledger.md @1d51aca; itens da célula lessons
decay: seasonal
created: 2026-07-02T04:50:53.607093900+00:00
updated: 2026-07-02T04:50:53.607093900+00:00
validated: 2026-07-02T04:50:53.607093900+00:00
links: 
---

A célula `lessons` guarda o flywheel de defeitos do AVP: classes recorrentes mineradas de falhas REAIS dos pilots, cada uma com o veredito **AVP-candidate** (endurecer cobertura existente vs archetype novo proposto). Fonte canônica: `docs/defect-ledger.md` (repo); a rotina `defect-collector` (workspace dev) atualiza tudo semanalmente quando habilitada.

Primeira colheita (2026-07-02, itens): 2fcc35be (authorization scope — declarar per-slice), dc6a4883 (phantom-success — implementar oracle .NET), 268d9884 (second-order notification — seam state-based), e66882dd (lifecycle/submission — bind mais fundo), 2a0da862 (**persona-isolation — archetype NOVO frontend**), 6a2bdb4d (**mutation-atomicity — archetype NOVO backend**), f41ef0f1 (**webhook-effects-state — criterion novo**), e6b7eddd (shape-tolerance — design-tier). Também na célula: 18befdae (o design da rotina coletora).

Leitura macro da 1ª colheita: classes 1–4 pedem PROFUNDIDADE de binding (mecanismo existe; `af g slice --verify` ataca no nascimento); 5–7 são a fronteira genuína do catálogo — a ENTRADA da próxima sessão de evolução do protocol/catalog.json + Assay.Net.
