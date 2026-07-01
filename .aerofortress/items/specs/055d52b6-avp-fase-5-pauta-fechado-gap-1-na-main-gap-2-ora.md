---
id: 055d52b6-0913-47a0-bf1a-be897be81602
slug: specs
type: doc
title: AVP Fase 5 — pauta FECHADO: GAP #1 na main + GAP #2 oracle `submission-gate` minerado (Assay.Net 0.1.8 local, AGUARDA greenlight do release público)
tags: avp, clockwork, rollout, pauta, submission-gate, mining, release-pending, greenlight
provenance: observado
evidence: pauta main commit c1d9469 (GAP#1, pushed); pauta branch avp/submit-supplier-response-gate commit 7cee878 (GAP#2, NÃO pushed); avp branch mine/submission-gate commit 371014b (NÃO pushed, NÃO publicado); avp/protocol/catalog.json + assay.net/src/Assay.Net/Archetypes/SubmissionGate.cs + SubmissionGateTests.cs; Assay.Net 0.1.8 em local-feed; pauta full suite 1114/1114 verde
decay: seasonal
created: 2026-06-25T20:18:24.170195+00:00
updated: 2026-06-25T20:18:24.170195+00:00
validated: 2026-06-25T20:18:24.170195+00:00
links: 
---

Pilot **pauta** do rollout AVP ([[7d5c88f1]]) FECHADO localmente. Corrige o diagnóstico de partida em [[920d806c]] (nenhum dos 2 "gaps" era RED ativo; doctor 2.1.0 honestamente verde).

**GAP #1 — CreateUser (NA MAIN, pushed):** commit `c1d9469` (ff `6128cf9..c1d9469`, sem force). `CreateUser.Avp.Tests.cs` prova `rejects-duplicate` sobre o REAL `/account/users` (bearer admin via register→complete-agency-setup→login). NÃO flipou um RED (AF0030 casa por criterion-id global → Register já cobria); é cobertura PRÓPRIA aditiva e honesta sobre o endpoint admin. Bônus `requires-authentication` DEFERIDO: access-control não está no 0.1.6 publicado (entrou no 0.1.7 não-publicado) → exigiria feed não-canônico na main.

**GAP #2 — SubmitSupplierResponse: ORACLE MINERADO.** Forma exata pro greenlight:
- **Archetype `submission-gate`**, criterion **`gate-enforced-on-submission`** (sibling body-bearing do `lifecycle-gate`/`gate-enforced-server-side`). Subject: `SubmissionGateSubject(BaseUrl, ReadyTransitionPath, UnmetTransitionPath, object Body)`. Oracle: POST do MESMO Body well-formed → ready DEVE 2xx (prova o body válido) ; unmet DEVE 4xx (a recusa só pode ser o gate de precondição, não o body). Resolve o que o lifecycle-gate body-less não casa (probe sem body → 422 NoResponseItems = false-red).
- **BAD calibrado (nasce VERMELHO):** servidor que grava a submission num link unmet (gate só no FE) → 2xx no unmet → oracle FALHA. Tríade de testes no Assay.Net (38/38 verde): GOOD passa, BAD falha, e o lifecycle-gate body-less dá FALSE-RED no mesmo GOOD (justifica o archetype não ser redundante).
- **Bind em pauta (branch `avp/submit-supplier-response-gate`, commit `7cee878`, NÃO pushed):** slice `[Critical]` + `ProductionQuotes.spec.toml` (`gate-enforced-on-submission`) + `SubmitSupplierResponse.Avp.Tests.cs` (ready=awaiting link, unmet=link `.Expire()`, body precifica os itens do ready). Armar `[Critical]` trouxe o pacote inteiro de obrigações — fechado: AF0008 happy+sad journeys (post-condições), AF0026 RowVersion(xmin, migração no-DDL) em QuoteRequestItem+QuoteResponseItem. **Os 2 doctors verdes; full suite 1114/1114.**

**PLANO DE PUBLISH/VENDOR (aguarda greenlight do Lucas):**
1. Assay.Net 0.1.8 está só num **local-feed** (`avp/assay.net/local-feed`, registrado no NuGet.Config GLOBAL da máquina — nuget.config dos repos fica canônico). avp branch `mine/submission-gate` (`371014b`) NÃO pushed, NÃO publicado.
2. **Greenlight = publicar Assay.Net 0.1.8 no feed canônico/nuget.org** (o hostpoint Payments/Operations vai consumir o MESMO `submission-gate`). Depois: remover a linha avp-local do NuGet.Config global, e pushar o branch `avp/submit-supplier-response-gate` pra main do pauta (csproj já em 0.1.8 → resolve do nuget.org).
3. Nota de versão: 0.1.7 (access-control) também está committed-não-publicado no avp; decidir se 0.1.8 (cumulativo, já inclui access-control) é o release único ou se 0.1.7 publica antes.

Próximo pilot do rollout: **hostpoint** (esboço no [[7d5c88f1]]).
