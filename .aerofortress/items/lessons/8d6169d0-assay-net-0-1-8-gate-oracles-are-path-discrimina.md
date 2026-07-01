---
id: 8d6169d0-46e1-4d63-acb4-2925d97bef74
slug: lessons
type: reference
title: Assay.Net 0.1.8 gate oracles are PATH-discriminated — body-id (collection-POST) endpoints can't bind a gate AVP honestly
tags: 
provenance: observado
evidence: 
decay: stable
created: 2026-06-26T02:45:13.317474600+00:00
updated: 2026-06-26T02:45:13.317474600+00:00
validated: 2026-06-26T02:45:13.317474600+00:00
links: 
---

Inspected `LifecycleGate.cs` / `SubmissionGate.cs` (Assay.Net 0.1.8, avp HEAD 371014b "mine submission-gate archetype"). Both gate oracles discriminate ready-vs-unmet by **URL PATH**: `LifecycleGateSubject(BaseUrl, ReadyTransitionPath, UnmetTransitionPath)` posts body-less to two paths; `SubmissionGateSubject(BaseUrl, ReadyTransitionPath, UnmetTransitionPath, Body)` posts the SAME body to two paths (ready→2xx, unmet→4xx). `Http.Accepted`=2xx, `Http.Rejected`=4xx.

CONSEQUENCE (hit on hostpoint AVP deepening, branch avp/hostpoint-deepening): an endpoint that carries the **resource id in the BODY** (a collection POST with no path id) **cannot bind a gate AVP honestly** — there is no second path to vary while holding the body fixed, and the same path+body twice can't yield 2xx then 4xx deterministically. Concretely: hostpoint `RequestService` (POST /operations/request, serviceId in body) and `CreateCheckoutPreference` (POST /payments/charges, transactionId in body) → left as documented GAPs (criteria stay role-required; gate guard stays proven by [Journey]s). The 5 path-id transitions (accept/accept-proposal/complete = lifecycle-gate; cancel/counter = submission-gate) bound fine.

ENHANCEMENT CANDIDATE (next Assay.Net version): a **body-discriminated** submission-gate variant (ready/unmet selected by a field in the body, two distinct bodies, same path) — so collection-POST gates can bind without reshaping the endpoint. This is the SECOND known 0.1.8 oracle-shape constraint, sibling to the own-resource-only verb-hardcoding (PUT-only) → verb-param 0.1.9 enhancement the luthier flagged for fluxoterra `UpdateLeadStatus`. Cardinal rule both share: **fix the oracle (global), never reshape the app endpoint to fit it.**
