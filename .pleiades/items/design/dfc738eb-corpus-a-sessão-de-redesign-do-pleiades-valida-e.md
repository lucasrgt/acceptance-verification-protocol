---
id: dfc738eb-d1a0-406f-9d43-130be901f69b
slug: design
type: fact
title: Corpus: a sessão de redesign do Pleiades valida e expande o Assay Design
tags: assay-design, corpus, design-catalog, gaps, glyph-renders, style-canonical, font-role-adherence, narrow-verifier, real-app-pilot, backlog
provenance: observado
evidence: Sessão de redesign do Pleiades (pleiades-harness/.redesign/: RULES.md, EXTRACTION.md, redesign.css; dev-harness.ts mock do Tauri; probes de paleta). Escapes observados ao vivo no app real via harness; mapeados ao catálogo de design do avp.
decay: seasonal
created: 2026-06-20T22:50:19.577036300+00:00
updated: 2026-06-20T22:50:19.577036300+00:00
validated: 2026-06-20T22:50:19.577036300+00:00
links: 
---

Uma sessão LONGA de redesign do app Pleiades (porte Frutiger-Aero → estética compozy em ciano,
no pleiades-harness) virou corpus observado para o Assay Design. O usuário apontou repetidamente
que o agente declarava "feito/verificado por probe" e ainda faltava "uma cacetada de coisas" —
o exato anti-padrão que o AVP existe pra impedir.

A FALHA-MÃE (o case de motivação mais forte que temos): o agente construiu um verificador
ESTREITO DEMAIS — um probe "o fundo é escuro?" — e declarou vitória. Texto azul, badge roxa e
glifo vazio PASSAM num check de escuridão e FALHAM na estética. Verificador que mede um proxy
barato em vez do critério de aceite real = falso verde. É o argumento central do Assay Design,
observado ao vivo.

CORROBORAÇÃO (escapes reais que caem em archetypes JÁ existentes — evidência, não critério novo):
- canvas da Diagramas colidindo com o painel Agente em largura estreita → layer-integrity +
  responsive-integrity (o próprio agente reconheceu: "exatamente o que o Assay pegaria").
- wrappers brancos atrás de inputs transparentes (luz presa no dark) → theme-parity.
- texto azul/aero, cores fora da escala → token-adherence.
Valor: sessão INDEPENDENTE, não cherry-picked, produziu escapes que aterrissam no catálogo —
evidência direta pra RQ "os archetypes miram escape real?".

LACUNAS reveladas (backlog grounded no corpus — candidatos a novos critérios):
1. glyph-renders / icon-não-tofu: ícone/glifo renderiza VAZIO (fonte/glifo não carregou; caixa
   vazia nos controles de janela). DISTINTO de icon-correctness (que julga significado assumindo
   que renderizou). Mecânico, barato (geometry/style: caixa não-vazia + fonte carregada). Candidato
   mais limpo a archetype novo.
2. style-canonical (recipe do componente): badge colorida (azul "Sonnet 4.6", roxa "via ponytail")
   em vez do recipe mono/uppercase/monocromático do DS. composition-canonical checa ESTRUTURA
   (presente/ordem/identidade), não que o componente bate com o RECIPE VISUAL canônico. Irmão visual.
3. font-role-adherence: fonte caindo no sistema em vez de Geist/Nippo/mono. type-hierarchy checa
   tamanho/nível, não FAMÍLIA; token-adherence checa cor/espaço/raio/font-SIZE, não font-FAMILY.
   Lacuna: a família renderizada por papel tem que bater com o DS (sem fallback silencioso).

LIÇÕES de implementação do verificador (afiam o que existe, não são archetype):
- token-adherence ao vivo = classificar a cor COMPUTADA por distância de matiz a {eixo-neutro ∪
  marca-ciano}, não binário "é escuro". Eixo-neutro = saturação baixa; marca = matiz ~165-200.
- contar tinta de GRADIENTE e box-shadow, não só background-color sólido (o probe de bg sólido
  deixou botões com gradiente passarem — falha real da sessão; o probe v2 com gradiente pegou).
- o `url` seam + dev-harness que o agente montou (renderiza o app REAL no browser via mock do
  Tauri oficial mockIPC, dev-only/guarded) É o piloto que a tier `geometry` precisa. Valida a
  direção do real-app pilot end-to-end (ver item [[geometry-probes-load-surfaces-via-adapter-design]]).

RESSALVA de grounding (pra não repetir a pressa): a regra de ouro do catálogo é repro fiel de
COMMIT real + mutation family 100%. Isto é escape OBSERVADO EM SESSÃO — forte como motivação,
mas pra virar critério cada lacuna precisa do seu repro fiel + família de mutação (1 iteração de
loop por archetype). Arquivado como backlog grounded, NÃO adicionar archetype meio-pronto.

Também reforça: o "design system as data" (RULES.md do pleiades mapeia cada regra → archetype:
R1.1/R1.3→token-adherence, R4.3→token-adherence, R5.1→accent, R6.x→layout/responsive/tap-target)
é o ground-truth que o Assay Design consome. Criar o DS do Pleiades destrava as duas frentes.
