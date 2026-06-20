---
id: 42005b73-156d-438f-a4a8-1b215365d5ed
slug: design
type: project
title: Design catalog · composition-canonical executed (atoms/molecules/organisms: slots present, ordered, canonical)
tags: 
provenance: observado
evidence: commit e890b35; bench/composition-canonical.test.ts detection 1/1 + mutation 4/4; full suite 165 tests green, tsc 0
decay: stable
created: 2026-06-20T20:26:27.450844800+00:00
updated: 2026-06-20T20:32:42.729384100+00:00
validated: 2026-06-20T20:32:42.729384100+00:00
links: 
---

**Design-cycle iteration 3 — 4th design criterion.** `composition-canonical · canonical-composition`: a screen's landmark slots are the canonical DS components, present and in declared order (back · icon · title). The user's exact atoms/molecules/organisms + "voltar acima do título com ícone certo" example.

**Pivoted from color-contrast** — the contrast/a11y escapes in the private repos are TOOLING adoption (jsx-a11y eslint), not specific contrast-failure fixes → under-grounded as a standalone runtime criterion (largely static-doctor territory). composition-canonical was far better grounded: project P has 9 real "consolidate hand-rolled X into one <Component>" escapes. Gold rule respected.

**Verifier (jsdom):** DS components emit `data-slot` + `data-ds`; the probe reads `[data-slot]` in DOM order and checks presence, order, and that each slot's data-ds == expected component (a bespoke fork has no data-ds → caught). Subject gains a `composition` seam. Mutation 4/4: wrong-order, missing-icon, bespoke-back, missing-back.

seenIn 897c6aa0, 2c9376e7, c596531b.

**Design catalog: 4 criteria, 17/17 mutants killed, false-alarm 0.**

**LEAK LESSON (this item itself):** the original body wrote a literal private project name ("project P" was originally the real name) — it slipped into the committed file and PUSHED (commit d76092e) because the pre-commit leak-scan was chained with `;` not `&&`, so its warning didn't block. Scrubbed via amend + force-with-lease (remote → fd7346c). RULE: never write private names in .pleiades item bodies (they commit to the PUBLIC repo); use the transfer.md scheme (marketplace / project P / project F); and the leak-scan MUST block the commit (&&), never warn-and-proceed. [[f4899d42]]
