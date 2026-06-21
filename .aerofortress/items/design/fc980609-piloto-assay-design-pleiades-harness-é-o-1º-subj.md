---
id: fc980609-338c-4330-b058-baf4b0805b60
slug: design
type: fact
title: Piloto Assay Design: pleiades-harness é o 1º subject; app só renderiza no Tauri
tags: 
provenance: observado
evidence: puppeteer goto http://localhost:7770 → rootKids:0, body vazio, erros "Cannot read properties of undefined (reading 'metadata' / 'transformCallback')" (window.__TAURI_INTERNALS__ ausente). pleiades-harness/.redesign/ tem tokens.css/components.css/RULES.md/preview.html (rebrand ciano do compozy).
decay: stable
created: 2026-06-20T21:52:56.917809600+00:00
updated: 2026-06-20T21:52:56.917809600+00:00
validated: 2026-06-20T21:52:56.917809600+00:00
links: 
---

O 1º piloto do Assay Design é o **pleiades-harness** (app Tauri+React em C:/Users/lucas/dev/pleiades-harness). Em paralelo nasceu o design system dele (rebrand ciano `#22d3ee` da estética compozy/Tailwind-v4-shadcn), que vira o "design system as data" / ground-truth do verificador.

**CONSTRAINT que muda o plano do piloto de geometria**: o app NÃO renderiza num browser puro — só dentro do webview do Tauri (tem `window.__TAURI_INTERNALS__`). `page.goto('http://localhost:7770')` (o seam `url` que adicionei em adapter-design/surface.ts + loadSurface) dá white-screen: o `@tauri-apps/api` acessa `.metadata`/`.transformCallback` de internals indefinidos e o React crasha antes de pintar o shell.

**Implicação**: pra o `url`-seam do tier de geometria rodar contra o pleiades, precisa de (a) um STUB do `__TAURI_INTERNALS__` injetado em dev (invoke→Promise vazio, transformCallback, metadata.currentWindow) — um "dev harness" que faz o app real renderizar no browser; ou (b) um build browser-mode do app. O MESMO harness destrava a verificação visual do redesign (poder screenshotar o app real fora do Tauri). É o próximo passo que conecta as duas frentes (redesign + piloto).
