---
id: e3f776f6-fbff-464a-b125-bbcde93f5f91
slug: build
type: doc
title: Loop de correção dos 125 pontos da auditoria — estado vivo (checklist em .aerofortress/audit-fix-progress.md)
tags: loop, auditoria, correcoes, estado, handoff
provenance: observado
evidence: .aerofortress/audit-fix-progress.md; commits 52bc490, b209d2b e o commit do settle; assay/src/adapter-react/settle.ts; assay/src/core/compose.ts
decay: volatile
created: 2026-07-01T20:42:00.912405300+00:00
updated: 2026-07-01T20:42:00.912405300+00:00
validated: 2026-07-01T20:42:00.912405300+00:00
links: 
---

Loop em andamento: corrigir TODOS os 125 pontos da auditoria (item [[82f42d4f]]). Condição de parada: todos os checkboxes de `.aerofortress/audit-fix-progress.md` marcados. Regra do fluxo: implementar bloco → `npx tsc --noEmit` + `npx vitest run` (assay/) + `dotnet test` (assay.net/) verdes → marcar checkboxes → commit (SEM trailer de IA, regra do repo) → push no fim de blocos maiores.

**Feito e commitado (main):** Bloco 1 higiene git (52bc490 — nupkgs ignorado; local-feed JÁ era ignorado por assay.net/.gitignore, ponto 98 era parcialmente falso; branches pré-scrub arquivadas em C:\Users\lucas\dev\avp-prescrub-backup.bundle e deletadas; .redesign-*.mjs removidos). Blocos 2-3 core+judge (b209d2b — threshold, Verdict com applicable/passed/durations/versões, ConditionId aberto, dup-id guard, verdictToJsonLine, composeVerdicts em core/compose.ts, judge memoizado+retry+timeout+model no verdict; PROTOCOL_VERSION agora mora em core/types.ts = '0.2.0', re-exportado por protocol.ts; catálogos REGENERADOS com `requires` serializado — pontos 53/54 efetivamente feitos; JS package 0.2.0, peers opcionais RTL/user-event/msw/puppeteer, exports ./judge + ./design/browser via src/adapter-design/browser-index.ts, tsup target node20, LICENSE copiada pra assay/). Bloco 4 parcial (settle compartilhado em src/adapter-react/settle.ts com settleUntil + escala ASSAY_SETTLE_MS_SCALE; codemod matou os 26 sleeps locais; drive.tsx: reset de handlers escopado por drive via previousDriveHandlers + double-activate determinístico com firstRequestGate/releaseFirstRequest).

**Gotchas descobertos:** cwd do Bash NÃO persiste confiável entre calls (usar caminhos explícitos/cd no mesmo comando). Testes .NET leem o catalog via TestCatalog (arquivo do repo) — regen do catálogo não quebrou (System.Text.Json ignora props desconhecidas). claude-judge.test.ts usa toEqual estrito → verdict agora carrega `model` (teste atualizado; retries:0 no teste de throw). tsconfig include ganhou "test". defineVerification: gate agora é score>=threshold com fails no message. Suites de referência: 241 TS / 40 .NET verdes pós-core.

**Próximo:** terminar Bloco 4 (19 endpointHits por path em probe.ts; 20 onUnhandledRequest 'warn' em vitest.setup.ts + example; 21/22 identity loud-fail + factory de stubs; 23 comentário deliberado noFalseSuccess; 24 seam readout no temporal; 25 registries `any` documentado tirando 27 casts em verify.ts×3; 26 doc precedência hooks; 27 exports de tipos em adapter-react/index.ts — IdentitySubject, ReactTemporalSubject, ReactPagingSubject, ReactResilienceSubject, ReactMoneySubject, ReactLifecycleSubject). Depois Bloco 5 HTTP (helper único src/adapter-http/wire.ts com timeout AbortSignal, deepEqual em serverIsAuthoritative, chaves random, trigger check + delta de inbox no second-order, rejectWith real no TS — 500 NÃO é refusal), Bloco 6 design (tokens/temas injetáveis via options, normColor rgba/hsl/named/oklch, alpha compositing, hatch hooks em verifyDesign/Browser, chrome detection LOCALAPPDATA), Blocos 7-15 conforme checklist. Pontos já parcialmente adiantados do Bloco 13: 92-95, 105 (falta doc README), 89 metade JS.
