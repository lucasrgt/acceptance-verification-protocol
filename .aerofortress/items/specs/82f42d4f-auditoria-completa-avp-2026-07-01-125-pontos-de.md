---
id: 82f42d4f-fbea-4d1b-9b5a-47044156612f
slug: specs
type: doc
title: Auditoria completa AVP (2026-07-01) — ~125 pontos de melhoria mapeados, suites verdes
tags: auditoria, melhorias, avp, assay, assay-net, qualidade
provenance: observado
evidence: assay/src/adapter-react/vitest.ts:41; assay.net/src/Assay.Net/Runner.cs:59-72; .github/workflows/publish.yml; assay/tsup.config.ts; assay.net/local-feed/*.nupkg (git ls-files); docs/catalog.md:150-155; git branch -a
decay: seasonal
created: 2026-07-01T20:18:49.805729500+00:00
updated: 2026-07-01T20:18:49.805729500+00:00
validated: 2026-07-01T20:18:49.805729500+00:00
links: 
---

Auditoria exaustiva do repo (assay TS + assay.net + bench + periferia + infra). Baseline: vitest 235/235 verde (57 arquivos), dotnet test 40/40 verde (1 warning xUnit1013), tsc limpo.

**Top temas (bugs reais / riscos altos):**
1. `defineVerification.threshold` é letra morta — `expect(fails).toHaveLength(0)` roda antes do check de threshold (adapter-react/vitest.ts).
2. SEM CI de teste — só publish.yml existe; publish não roda testes antes de publicar.
3. Divergência de conformance TS↔.NET: exceção inesperada vira `fail` no TS mas ABORTA o run no .NET Runner; `AvpFailException` não carrega evidence; `Http.Refused` .NET hardcoda 401/403/404 enquanto o TS aceita qualquer não-2xx (um 500 passa como "refusal" no TS — false-green sutil).
4. Geometry tier (9 arquétipos design) NÃO exportado no pacote npm (verifyDesignBrowser/openBrowser fora do exports/tsup) — inusável por consumidores.
5. Idempotency probes usam chaves fixas (idem-key-A/B no TS, k1/k2 no .NET) — re-runs contra servidor persistente degradam pra replay silencioso.
6. 26 sleeps mágicos (0–160ms) nos adapters + helpers fetch duplicados em 5 arquivos http + nenhum timeout de rede em fetch/HttpClient.
7. Git hygiene: 3 .nupkg binários COMMITADOS em assay.net/local-feed (docs afirmam gitignored); branches locais pre-scrub (`backup-pre-scrub`, `pre-public-history`) guardam história pré-anonimização (commit cita lazuli) — risco de push acidental; `nupkgs/` sem gitignore.
8. Vazamento de anonimização em docs: prefixos `LZ*`/`LZFE*` em docs/catalog.md e docs/assay-net.md (hoje é AF*/AFFE*).
9. Versões dessincronizadas: JS 0.1.0 vs .NET 0.1.9 vs tag v0.1.9 — o npm job publicaria 0.1.0 num tag 0.1.9.
10. Docs stale: README raiz (Slice 1/2 oráculos/MIT TBD; quickstart npm install na raiz não funciona), docs/assay-net.md (0.1.0/28 testes), PROTOCOL.md sem `double-activate` no eixo interaction; exemplo todo-app importa 'assay' mas pacote publicado é '@aerofortress/assay'.

Lista completa (~125 itens, por área: core, judge, adapter-react, adapter-http, adapter-design, protocolo, assay.net, bench, eslint-plugin, escape-miner, CLI, packaging/CI, docs, ciência/roadmap) entregue no chat da sessão desta data. Gaps científicos abertos: loop caos→verde não fechado, curva de convergência não automatizada (números de accuracy só em console.log), judge model nunca calibrado com API real.
