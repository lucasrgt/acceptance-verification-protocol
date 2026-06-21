---
description: Mine NEW backend (http/server) AVP criteria from public OSS repos — clone blobless, find real bug-fix pairs (escapes), map each to a candidate criterion with evidence. Use when the known catalog backend criteria are closed and the backend frontier needs growing, or to ground a proposed criterion in a real repro.
---

# Mine backend escapes from public OSS

The catalog grows by ESCAPE: a defect that slipped past verifiers becomes a new criterion
(fail once, never twice). Backend escapes (authz, idempotency, money, lifecycle, integrations)
are the ~40% only a .NET adapter reaches.

## Rules
- Clone into the scratch area `avp/dev/_acervo/` — it is gitignored, **never committed**.
- Prefer blobless/shallow to save disk: `git clone --filter=blob:none --no-checkout <url> avp/dev/_acervo/<name>`
  then sparse/log over the history. Public OSS only (documenso, cal.com, bitwarden, firefly-iii,
  gitea are the established corpus). Read for analysis; never copy repo code verbatim into AVP.
- Output is CANDIDATES, not commits. Do not edit shared files (catalog/protocol) while mining.

## Steps
1. Clone the target repo into `avp/dev/_acervo/<name>` (blobless).
2. Search the bug-fix history for server-side escapes: `git log` for fixes touching authorization,
   webhooks/signatures, idempotency keys, money/rounding, state-transition guards, notifications.
   A good escape = a (pre-fix vulnerable, post-fix correct) pair you can reproduce.
3. For each escape, map to AVP: which archetype/criterion does it belong to? Is it already in
   `avp/protocol/catalog.json`? If covered → note it as evidence (`seenIn`). If NOT covered and
   high-frequency → propose a NEW criterion (id, one-line statement, condition, the seam to force).
4. Return a ranked list of candidates: `{archetype, criterion-id, statement, condition, evidence-refs,
   why-it-clears-the-bar}`. Drop anything ungrounded (no faithful repro) — do not invent criteria.

## Stop condition
Stop a mining sweep when an independent pass over fresh repos surfaces NO new high-value uncovered
backend criterion (the frontier is "dry") — mirror how the FE/design frontier was declared dry.
