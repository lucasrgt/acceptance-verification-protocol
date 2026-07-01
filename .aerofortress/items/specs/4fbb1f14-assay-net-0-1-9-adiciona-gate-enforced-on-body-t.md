---
id: 4fbb1f14-0f58-42f7-982f-bbdb4fd3c8c0
slug: specs
type: fact
title: Assay.Net 0.1.9 adiciona gate-enforced-on-body-target
tags: avp, assay.net, backend, submission-gate
provenance: observado
evidence: C:\Users\lucas\dev\avp\protocol\catalog.json; C:\Users\lucas\dev\avp\assay.net\src\Assay.Net\Archetypes\SubmissionGate.cs; commit 1185797; tag v0.1.9
decay: stable
created: 2026-07-01T04:53:09.733348300+00:00
updated: 2026-07-01T04:53:09.733348300+00:00
validated: 2026-07-01T04:53:09.733348300+00:00
links: 
---

Assay.Net 0.1.9 introduziu o critério `gate-enforced-on-body-target` no arquétipo `submission-gate` para mutações em que o recurso discriminante vem no corpo, não no path. O oracle mantém o mesmo endpoint e envia dois corpos de mesma forma apontando para ids diferentes: um recurso pronto deve aceitar 2xx, o recurso com precondição não atendida deve recusar 4xx. Isso cobre padrões como `POST /operations/request` com `serviceId` e `POST /payments/charges` com `transactionId`, sem redesenhar endpoints para caber no oracle antigo.
