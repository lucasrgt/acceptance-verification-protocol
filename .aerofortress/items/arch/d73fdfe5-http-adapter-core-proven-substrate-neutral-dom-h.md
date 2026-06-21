---
id: d73fdfe5-0c67-4e53-91af-0f869c42b5e8
slug: arch
type: decision
title: HTTP adapter: core proven substrate-neutral (DOM + HTTP), backend slice opened
tags: arch, http-adapter, backend, authorization, idor, substrate-neutral, core
provenance: observado
evidence: src/adapter-http/; bench/authorization.test.ts; suite 55/55; commit pending
decay: stable
created: 2026-06-20T15:14:16.223832+00:00
updated: 2026-06-20T15:14:16.223832+00:00
validated: 2026-06-20T15:14:16.223832+00:00
links: 
---

Started the HTTP adapter (src/adapter-http/) — the ~40% backend slice the corpus justified. First backend archetype: `authorization` / `own-resource-only` (IDOR), verified over REAL HTTP (drives a zero-dep node http repro server; MSW onUnhandledRequest:'bypass' lets the localhost fetch through). detection 1/1, false-alarm 0; suite 55/55, tsc clean.

KEY ARCH PROOF: verifyHttp reuses the SAME neutral core runner (src/core/run.ts) as the React adapter. The core is now proven SUBSTRATE-NEUTRAL — DOM and HTTP are just two adapters providing VerifyHooks{probe}. This validates the L0/L1/L2 layering (ADR 0001): a backend archetype runs through the same runner as the DOM archetypes, no React in the path.

WHY HTTP (not .NET-specific): the backend escapes (authz/IDOR, idempotency, webhook signature, notify) are HTTP-observable and LANGUAGE-NEUTRAL — one HTTP adapter verifies them against ANY backend (Rails/Go/Laravel/.NET), which the multi-stack corpus showed dominate those apps. Assay.NET becomes an in-process variant, but the wire adapter is the universal one.

Probe substrates now: RTL+MSW drive, render-vs-API, render-as-actor, navigate-spy, mount-and-count, mounted TanStack router, paint-timing, real HTTP request. 7 archetypes total (6 FE + 1 BE).

NEXT BE archetypes (HTTP adapter, all wire-observable): role-required, server-is-authoritative (authorization); webhook-signature-verified, callback-resolves-entity (integration-integrity); notifies-all-parties (second-order-effects); idempotent (already FE; BE variant = double-POST → one effect over the wire).
