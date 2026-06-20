---
id: 067d13b4-7d86-4f47-b800-77558a399f4f
slug: catalog
type: project
title: Real Claude judge for the model oracle (claudeJudge) + leak lesson
tags: 
provenance: observado
evidence: npx tsc --noEmit clean; bench/claude-judge.test.ts 4 tests green (fake client, fail-closed); npx vitest run = 29 files/121 tests pass; leak-scan of staged tree clean after rewording 1d79047e
decay: stable
created: 2026-06-20T17:41:45.979918700+00:00
updated: 2026-06-20T17:41:45.979918700+00:00
validated: 2026-06-20T17:41:45.979918700+00:00
links: 
---

DEEPEN step (step 2 of 3 the user asked for before Assay.NET): the `model` oracle now has a REAL reference judge. `src/judge/claude.ts` → `claudeJudge(options): Judge` — Claude-backed LLM-as-judge for `error-is-specific` (the only model criterion). Design: core stays judge-neutral (Judge type in core/dsl); the SDK is NEVER imported by core — `@anthropic-ai/sdk` is loaded LAZILY via an indirected specifier (`const pkg='@anthropic-ai/sdk'; await import(pkg)`) so typecheck/tests don't need it installed, and it's declared as an OPTIONAL peerDependency in package.json. Configured via env/options, never a config file (ADR 0001). Model defaults to `claude-opus-4-8` (per the claude-api skill's hard rule; override to claude-haiku-4-5 for cost). Uses structured outputs (`output_config.format` json_schema {pass, reason}). FAIL-CLOSED: any parse error / client throw / SDK-load failure → {pass:false} (a false PASS is the catastrophic error for a verifier). Exported from src/index.ts as `claudeJudge`. Tests `bench/claude-judge.test.ts` inject a fake AnthropicLike client (no network) — deterministic; live path runs only with a real key. Existing model-oracle.test.ts stub-judge tests still pass.

State: tsc clean, full suite 29 files / 121 tests green (was 28/117 → +1 file/+4 judge tests). Committed locally (will commit this turn). NOT yet about Assay.NET.

CRITICAL LEAK LESSON (provenance observado): NEVER write the literal private project names (the 3 anonymized terms) in any TRACKED file — not even when DOCUMENTING the anonymization/scrub. My git-resolved memory item (1d79047e) quoted them in its body and is tracked → would have re-leaked to the public repo on push. The pre-commit guardrail `git grep --cached -niE "<names>" -- . ':!package-lock.json' ':!.pleiades/items/geral/fc2e2566*'` caught it. Fix: reword to "the private project names" generically. Run that leak-scan on the STAGED tree (--cached) before every commit/push. [[git-resolved-history-scrubbed-of-the-anonymizati]] [[public-repo-anonymization-map-no-private-project]]

REMAINING per the user's plan: step 2 also nominally included (b) the 5 STATIC criteria as doctor rules — that's HOST-DOCTOR territory (lazuli-net LZ*/LZFE*), NOT avp's repo, so out of scope here (note honestly to the user); (c) consolidate docs/transfer — light/optional. Step 3 = mine NEW domains for new escape classes (clone unsampled-domain repos into dev/_acervo/, tier-1.5, propose 1-2 new archetypes). THEN step 4 = Assay.NET.
