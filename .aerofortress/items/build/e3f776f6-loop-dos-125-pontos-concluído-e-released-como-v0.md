---
id: e3f776f6-fbff-464a-b125-bbcde93f5f91
slug: build
type: doc
title: Loop dos 125 pontos: CONCLUÍDO e RELEASED como v0.2.0 (NuGet + npm + GH release; pilots conformados)
tags: loop, auditoria, concluido, 0.2.0, release, publish
provenance: observado
evidence: gh run 28551563366 (3/3 success); npm view @aerofortress/assay versions = [0.1.0, 0.2.0]; nuget flatcontainer assay.net inclui 0.2.0; commits dos pilots 69b408d/068603a4/e10cca3; atribuição pauta: 10/10 falham igual em 0.1.8 e 0.2.0
decay: seasonal
created: 2026-07-01T20:42:00.912405300+00:00
updated: 2026-07-01T22:37:06.656915300+00:00
validated: 2026-07-01T22:37:06.656915300+00:00
links: 
---

O loop de correção dos 125 pontos da auditoria (checklist `.aerofortress/audit-fix-progress.md`, 126/126) foi concluído em 01/07/2026 e **publicado como v0.2.0** no mesmo dia.

**Release v0.2.0 (01/07/2026):**
- Tag anotada `v0.2.0` em 9ff87ee → workflow publish run 28551563366: gate (tag==versões + suítes completas) + nuget + npm, **3/3 success**.
- **NuGet**: Assay.Net 0.2.0 (indexou em ~3 min). **npm**: @aerofortress/assay 0.2.0 + @aerofortress/eslint-plugin-assay 0.2.0 (**primeira publicação do plugin** — antes só existia assay@0.1.0; as tags 0.1.x nunca publicaram npm). Ambos com provenance (sigstore).
- GitHub release criada com as notes do CHANGELOG: https://github.com/lucasrgt/acceptance-verification-protocol/releases/tag/v0.2.0

**Pilots conformados no mesmo dia (todos via PackageReference; nenhum usa os pacotes npm do avp):**
- fluxoterra `69b408d` (branch avp/fluxoterra-deepening): 132/132 verde.
- hostpoint `068603a4` (branch release/consolidate-avp): 958/958 verde + 1 skip env-gated.
- pauta-web `e10cca3` (main): 1212 verdes; **17 falhas PRÉ-EXISTENTES** no módulo novo InternalAuthorizations (commit a2c067a do pilot) — atribuição provada rodando idêntico no 0.1.8. Nada flipou pela semântica nova (5xx≠refusal).

**Gotchas operacionais da publicação:**
- npm de pacote NOVO fica 404 por alguns minutos após publish verde — conferir o log do job (`+ pacote@versão`) antes de suspeitar do workflow.
- `git push` pode falhar com "cannot lock ref ... is at <sha-novo> but expected <sha-velho>" quando o push CHEGOU (entrega duplicada perde a corrida de lock) — confirmar com `ls-remote` antes de re-tentar.
- Gotchas do loop em si (cwd do vitest, realm do AbortSignal com MSW, regen de catálogo) seguem válidos — ver histórico deste item.
