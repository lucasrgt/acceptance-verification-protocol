---
id: c4a73da8-781d-493d-aede-623d8fd19e7f
slug: geral
type: rule
title: Constituição — AVP (protocolo) + Assay (implementação)
tags: constituicao, avp, assay, protocolo
provenance: inferido
evidence: 
decay: stable
created: 2026-06-20T03:52:59.189727800+00:00
updated: 2026-06-20T03:52:59.189727800+00:00
validated: 2026-06-20T03:52:59.189727800+00:00
links: 
---

**AVP — Acceptance Verification Protocol**: verificação determinística de COMPORTAMENTO para features web feitas por IA. Tese: LLM converge só onde há verificador; matemática tem juiz, "tela pronta?" não. AVP fabrica o verificador — converte "feature pronta?" (subjetivo) em "critérios passaram?" (checável). O determinismo mora no VERIFICADOR, não na tela. Trocadilho: acesso venoso periférico — acessa a veia do sistema e confirma que está remediado.

**AVP = o PROTOCOLO** (conceitos neutros de linguagem: subject/criterion/oracle/condition/verdict; reimplementável em qualquer linguagem). **Assay = a implementação de referência** (pacote JS/React: `assay`, `assay/react`, `assay/react/vitest`). **Assay.NET** = irmão backend futuro (justificado por dado: ~42% do caos action-effect é backend). Precedente: LSP/TAP/SARIF — um protocolo, N implementações nomeadas.

**INVARIANTES (não negociar):** camada FINA, não framework (ADR 0001) — cavalga substrato maduro (Vitest/RTL/MSW/axe-core/LLM-judge), nunca runner/config/IR próprios; **sem `assay.config.ts`**. NÃO é addon de runner — `verify()` devolve `verdict` portável e roda em qualquer host; o adapter se prende ao SUBSTRATO da plataforma (web=DOM+MSW), não ao runner. Dicionário de critérios cresce por ESCAPE (falhar uma vez, nunca duas). AI-first (verdict = sinal acionável no loop) + human-curated. Repo em INGLÊS + neutro (sem nome de cliente → "a real-world tourism project").

**Estado:** Slice 1 verde (arquétipo action-effect, 3 critérios, oráculo misto mechanical+model, `assay verify`, exemplo full-stack). Foco atual: **CORE científico** (dicionário + medição + loop); periferia depois. Células: geral, arch, specs, plano.
