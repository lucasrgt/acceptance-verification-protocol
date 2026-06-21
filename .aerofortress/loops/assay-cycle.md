---
description: Ciclo completo do Assay — minera escapes reais, extrai o próximo critério de maior valor, implementa com repro fiel + benchmark, endurece por mutação e continua
stop: uma rodada de mineração+seleção não acha mais critério de alto valor NÃO-coberto cujo adapter exista (FE/HTTP); ou 2 iterações seguidas só rendem critérios triviais ou bloqueados (ex.: só rodam em .NET)
max: 30
---

Cada iteração fecha o laço **caos → verde** para UM critério novo: do escape real
ao benchmark verde. A regra de ouro é anti-auto-engano: **nunca molde um repro pra
tripar um critério** — reproduza o DIFF real e rode o arquétipo inteiro; o GOOD
passa sem falso-alarme, o BAD falha no critério-alvo. Um false-green é o erro
catastrófico.

O estado vive na REDE (workspace `avp`) e nos docs — consulte antes de decidir,
atualize depois: `docs/catalog.md` (dicionário + tabela de status do que já é
executado), `docs/corpus-multistack.md` (corpus por stack), `docs/transfer.md`
(RQ4), `docs/mutation.md` (robustez). Dois tiers, não confunda: **corpus
classificado** (tier-1, escala, barato) vs **benchmark executado** (curado, fiel,
a prova).

Iteração 0 (só na 1ª):
- Baseline VERDE no avp: `npx vitest run` e `npx tsc --noEmit`.
- Recupere o estado: `mcp__knowledge__query` (workspace avp) por "catalog" /
  "http-adapter" / "corpus"; leia a tabela de status do `docs/catalog.md` (o que já
  é executado, e por qual adapter).
- Garanta o acervo: clones blobless em `dev/_acervo/` (adicionar repo:
  `git clone --filter=blob:none --no-checkout --single-branch <url> dev/_acervo/<name>`).
  Mantenha diversidade de stack (node/rails/laravel/dotnet/go).

A cada iteração:
1. **Minerar.** `node tools/escape-miner/mine.cjs <repo> <label>` sobre o acervo (e
   os 3 apps locais). Olhe a distribuição por arquétipo: onde há VOLUME de escapes
   ainda não coberto por um critério executado.
2. **Selecionar o próximo critério** por valor = frequência no corpus × ainda-não-
   executado × adapter disponível. FE → adapter React; BE → adapter HTTP sobre
   **node puro** (`.NET` fica pra depois — NÃO selecione critério que só roda em
   .NET). Para o candidato, LEIA os diffs reais dos commits-fonte
   (`git -C <repo> show <hash>`) e extraia o comportamento fiel (before/after, o
   sinal observável que mata o mutante).
3. **Implementar** (tier executado):
   - Repro fiel good/bad (do diff real) em `bench/dataset/`.
   - Critério no arquétipo (`src/archetypes/`) + probe no adapter
     (`src/adapter-react/` ou `src/adapter-http/`), registrado no `verify` do
     adapter; se o arquétipo já tem vários critérios, gate por seam em `applies`
     (padrão de navigation/data-honesty/authorization).
   - Benchmark em `bench/`: BAD falha o critério-alvo, GOOD passa sem falso-alarme,
     emite `detection N/N`. Servidor de repro de backend = node puro (`node:http`),
     arquivo `.ts` (não `.cjs`).
4. **Endurecer** (o loop dentro do loop): adicione uma família de mutantes do
   critério em `bench/mutation/mutants.tsx` + `bench/mutation.test.ts`. Rode: todo
   mutante deve MORRER e o benigno ficar verde. Sobreviveu = buraco real → endureça
   o probe até matar. Mantenha o mutation score em 100%.
5. **Verde + registrar.** Regenere o artefato do PROTOCOLO (o drift guard exige):
   `ASSAY_WRITE_PROTOCOL=1 npx vitest run protocol-sync` → atualiza
   `protocol/catalog.json`; se o vocabulário (condição/oráculo/data model) mudou,
   atualize `docs/PROTOCOL.md`. O protocolo NUNCA pode ficar atrás da lib — o guard
   `bench/protocol-sync.test.ts` reprova a árvore se ficar. Depois `npx tsc --noEmit`
   + `npx vitest run` (TUDO verde). Atualize `docs/catalog.md` (tabela de status +
   totais) e o corpus se minerou repo novo. Persista o aprendizado na rede
   (`mcp__knowledge__store`, workspace `avp`, proveniência honesta). COMMITE o
   incremento verde — mensagem em INGLÊS, neutra;
   refs de outros projetos prefixadas (`gitea:`, `projp:`, `bitwarden:`). O avp não
   tem remote: o commit é local.

Invariantes (não negociar — `docs/CONVENTIONS.md`): repo sempre em INGLÊS e neutro
(sem nome de cliente, hashes opacos); nunca afrouxe um assert nem molde um repro;
árvore verde a cada commit; honestidade sobre o que é EXECUTADO vs apenas
CATALOGADO; o catálogo converge por acúmulo de escapes, nunca se prova completo.
DISCIPLINA ESTRUTURAL: todo arquivo ≤ 500 LOC (produção E teste) — passou de ~300
e já puxou os helpers óbvios, SPLIT por concern (pasta + barril fino), não empacote
mais (guard `bench/source-size.test.ts`); adapter é WIRE fino sobre o substrato,
nunca reimplemente o que a lib madura já faz; um concern por arquivo, barril é
re-exporter; split é aditivo (nunca quebre um path público).

Pare quando uma rodada de mineração+seleção não achar mais critério de alto valor
não-coberto com adapter disponível, ou quando 2 iterações seguidas só renderem
trivialidades ou critérios bloqueados em .NET. Relate o delta: critérios novos,
`detection` antes→depois, mutation score, cobertura do corpus, e o que ficou DE
FORA de propósito (e por quê).
