---
id: 18befdae-727d-4fd4-b185-f479c25113a9
slug: lessons
type: decision
title: Defect-collector: rotina que minera fix-commits + scars → ledger → candidatos a archetype do AVP
tags: avp, defect-collector, routine, archetype, fix-commits, scar, ledger, catalog
provenance: dito
evidence: C:\Users\lucas\dev\pleiades-harness\.aerofortress\routines\defect-collector.md ; descoberta por *.spec.toml ; alvo do ledger: C:\Users\lucas\dev\avp\docs\defect-ledger.md ; catálogo: avp/protocol/catalog.json
decay: stable
created: 2026-06-24T05:33:21.542892300+00:00
updated: 2026-06-24T05:36:00.645275100+00:00
validated: 2026-06-24T05:36:00.645275100+00:00
links: 
---

Criada (nasce DESABILITADA; usuário liga no painel): `pleiades-harness/.aerofortress/routines/defect-collector.md` (model sonnet, schedule weekly sun 04:00).

Fecha o loop da tese do AVP ("provar que funciona"): toda falha real que ESCAPOU vira um arquétipo de prova que faltava. Irmão do loop `forge` (atrito→skills); aqui é defeito→AVP.

O quê faz, semanalmente:
1. DESCOBRE os pilots dinamicamente (NÃO hardcode): um repo é pilot AVP se contém um manifesto `*.spec.toml`. Scan na raiz do workspace `for d in */; do find "$d" -name "*.spec.toml" ...`. Hoje casa: fluxoterra, hostpoint, pauta, e o sample-app do aerofortress-framework. Exclui corretamente `avp` (o provador) e a harness (não são pilots). Pilot novo que adotar AVP entra sozinho. Minera os fix-commits da janela de cada pilot (`git -C <abs> log --grep ^fix/^revert/hotfix/regress`), lendo o diff quando o subject não basta.
2. Coleta scars da rede (`mcp__knowledge__scars` por domínio) — essas SIM de todos os domínios, não só pilots.
3. CLASSIFICA cada defeito numa CLASSE recorrente (bypass de autz, reuso de token, violação de unicidade, estado null/empty, atomicidade/race, validação faltando em fronteira, vazamento entre tenants) — é a classe, não o caso, que vira archetype.
4. Consolida em `avp/docs/defect-ledger.md` agrupado por classe; campo decisivo **AVP candidate**: já coberto por archetype do catalog.json (e mesmo assim escapou → endurecer)? ou classe SEM cobertura → archetype NOVO proposto (nome+critério+sinal).
5. Espelha na rede do avp (mount `avp/lessons`, type doc, tag `avp-candidate`, dedup por classe — recorrência++).
6. Relatório na inbox: ranking de classes, cobertas vs candidatas novas.

USO POSTERIOR: o ledger + os itens `avp-candidate` são a ENTRADA de uma sessão futura de melhoria do AVP, que pega as classes sem cobertura e as vira archetypes em `avp/protocol/catalog.json` + Assay.Net. Ver [[forge-super-rotina-de-auto-aprimoramento]] (irmão).
