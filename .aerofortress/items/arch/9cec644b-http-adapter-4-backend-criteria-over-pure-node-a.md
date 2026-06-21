---
id: 9cec644b-a3c6-47f9-bee4-244d16fb2a1d
slug: arch
type: decision
title: HTTP adapter: 4 backend criteria over pure-node (authz×2, webhook, notify)
tags: arch, http-adapter, backend, webhook, notify, idor, role-required, node, registry
provenance: observado
evidence: src/adapter-http/; bench/{authorization,integration,second-order}.test.ts; suite 63/63; commit ea7faf5
decay: stable
created: 2026-06-20T15:19:13.888630100+00:00
updated: 2026-06-20T15:23:44.385266900+00:00
validated: 2026-06-20T15:23:44.385266900+00:00
links: 
---

HTTP adapter (src/adapter-http/) runs backend archetypes over REAL HTTP against pure-node (node:http) repro servers — user direction: node (express/pure) to simulate backend, .NET later.

ARCHETYPES/CRITERIA (each detection 1/1, false-alarm 0):
- authorization (probe.ts httpProbe + authHooks): own-resource-only (IDOR, requires 'ownership', subject.request) + role-required (privileged op as lesser role → must be refused, requires 'role', subject.privileged). gated in authHooks.applies by seam (mirrors React nav multi-criterion gating). server idor-server.ts (PUT /hosts/:id + GET /admin/hosts operator-only).
- integration-integrity (integration.ts webhookProbe): webhook-signature-verified — forged HMAC refused, valid accepted. server webhook-server.ts (exports sign()+WEBHOOK_SECRET; HMAC over JSON.stringify(body)).
- second-order-effects (second-order.ts notifyProbe): notifies-all-parties — POST trigger then GET each party inbox; any empty → fail. server notify-server.ts.

verify.ts = REGISTRY by archetype.name (mirrors React verify.ts); all reuse core/run.ts → core proven substrate-neutral DOM+HTTP.

GOTCHAS: MSW global bypass lets localhost fetch reach node servers. Repro servers MUST be .ts (tsc errors on .cjs import decl). HttpAuthSubject.request now OPTIONAL (+ privileged?). Shared HttpRequestSpec in subject.ts; sendStatus dup in probe.ts vs send in integration.ts (acceptable).

STATE: 8 archetypes (5 FE-substrate + 3 BE) = 20/20 detection, mutation 17/17, suite 63/63, tsc clean. catalog.md status table now complete through all 8.

NEXT BE (wire-observable, same registry pattern): idempotent-write (double-POST same key → one effect), server-is-authoritative (client-claimed privileged value ignored), callback-resolves-entity. Then dogfood HTTP adapter vs a real node app (dev/_acervo/documenso) or seeded express.
