---
id: 3da304dd-8f02-4adc-b5de-fb837d87ad2d
slug: design
type: doc
title: AeroFortress (ex-pleiades-harness) — redesign win7→compozy: mapa de arquivos e estado
tags: 
provenance: observado
evidence: C:/Users/lucas/dev/pleiades-harness/ (renomeado AeroFortress): src/redesign.css, src/dev-harness.ts, vite.config.ts, src/styles.css, src/fonts/clash-grotesk-*.woff2, .redesign/{tokens.css,recon.mjs,_*.mjs,*.png}
decay: stable
created: 2026-06-21T15:25:44.202655700+00:00
updated: 2026-06-21T15:25:44.202655700+00:00
validated: 2026-06-21T15:25:44.202655700+00:00
links: 
---

Redesign do app Tauri+React (dir ainda C:/Users/lucas/dev/pleiades-harness, produto renomeado **AeroFortress**) de Frutiger-Aero(win7) → flat-dark estética **compozy.com**. O usuário assumiu e refinou (recon própria); meu trabalho anterior foi base, parte superada.

**ARQUITETURA (como o app é vestido):**
- `src/redesign.css` — camada de OVERRIDE importada por ÚLTIMO em `src/main.tsx` (depois de styles.css/win7-titlebar.css). É onde o tema novo mora. `:root` define `--rd-*` e repont­a as mães do app (`--theme/--text/--border/--gloss/--side-*`).
- `src/dev-harness.ts` — mocka o IPC do Tauri (`@tauri-apps/api/mocks` mockIPC+mockWindows, SEMEADO com workspaces/sessões/agentes/rotinas/loops/plugins) só em browser/dev → o app REAL renderiza em `http://localhost:7770` sem backend, pra screenshot/verificação. No-op no Tauri real e em prod.
- `vite.config.ts` — fix `server.watch.ignored:["**/src-tauri/**"]` (senão EBUSY no .exe travado derruba o vite → tauri dev cai).
- `src/styles.css` — base aero (118KB). Já fiz `sed` neutralizando 53 cores de TEXTO azul/navy (#14395a→#e7e5e4 etc.). Fim do jogo é substituir.

**TOKENS CORRIGIDOS pelo usuário (`.redesign/tokens.css` spec + `redesign.css :root` impl):**
- canvas `--rd-bg:#0c0a09` (rgb literal da seção compozy), card-POÇO `--rd-surface:#0a0908` (≤ canvas, borda define — NÃO superfície elevada; meus #1b1816/#211e1c eram claros demais), rail `--rd-sidebar:#080706`.
- **MARCA: sage green `#91d37d`** em redesign.css (`--rd-brand`), ink `#0c2912`, **glow REMOVIDO** (`--rd-glow:none`). ATENÇÃO: tokens.css (spec) ainda diz ciano `#22d3ee` — DISCREPÂNCIA spec×impl a resolver.
- display = **Clash Grotesk** peso 400 (woff2 em `src/fonts/`, precisa @font-face), body Geist, mono JetBrains. Texto stone, badges `.kind` mono UPPERCASE monocromático.

**MÉTODO:** probe headless (escaneia cada view por bg claro sólido+gradiente), `.redesign/recon.mjs` (playwright extrai computed styles do compozy ao vivo). Scripts de captura: `.redesign/shoot.mjs`, `probe.mjs`, `_*.mjs`.

**ESTADO/PENDÊNCIAS:** dev server `:7770` DOWN (tauri dev saiu — religar `npm --prefix <dir> run dev`). Views já flat-dark verificadas: Chat, Agentes, Rotinas, Loops, Conhecimento, Plugins, Diagramas, Configurações. Aberto: glifos dos controles de janela ainda quebrados (win7 põe `button::after` em position:absolute; minha tentativa em redesign.css não pegou), thread populada não verificada, "Cor da janela"(swatches win7) a decidir remover, substituir styles.css.
