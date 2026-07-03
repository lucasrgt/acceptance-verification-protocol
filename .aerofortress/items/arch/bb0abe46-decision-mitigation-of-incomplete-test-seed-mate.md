---
id: bb0abe46-0287-4bf4-a84f-944a01fb42ef
slug: arch
type: decision
title: Decision: mitigation of incomplete test seed materialization defect class via native gate
tags: defect-class, test-integrity, gate-architecture, seed-strategy
provenance: observado
evidence: APT/ASI commits 42eb912, a2c067a; pauta-web fix ~ff719ff; framework 2.1.4 changelog; CI run 28601795005 (first passing CI in repo history)
decay: stable
created: 2026-07-02T15:36:57.994079200+00:00
updated: 2026-07-02T15:36:57.994079200+00:00
validated: 2026-07-02T15:36:57.994079200+00:00
links: 
---

**Pattern identified**: test seeds that create referenced entities (e.g., `CustomerId = Guid.NewGuid()`) without materializing the required parent entity (e.g., Customer record with TradeName/CNPJ) cause assertions to silently pass against fabricated state, never validating the real code path.

**First occurrence**: APT and ASI modules (2026-06-21, commits `42eb912` and `a2c067a`, 35 minutes apart) were born with 100% test failures. Agente committed without running tests locally; no CI gate existed to enforce verification. Seeds fabricated CustomerId but no Customer, assertions compared against imagined state ('Cliente Exemplo', 22000 = net+10%), never materialized.

**Mitigation**: (1) pauta-web seeds now create Customer before referencing CustomerId, validate each step with `Ensure()`. Suite: 1239/1239 green. (2) Native gate in framework 2.1.4 prevents commit without test execution. (3) All starters (`af new`) born with gate infra.

**Why**: Exactly the class of escape that AVP exists to eliminate. Locked in via architecture—native gate in framework, gate in every starter scaffold—preventing this by design, not discipline. Defect-collector captures the pattern for recurrence mining.
