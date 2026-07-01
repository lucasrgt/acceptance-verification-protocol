# Audit fix progress — 125 points (2026-07-01)

Loop condition: ALL points checked. Numbers match the audit list delivered in chat
(stored as network item 82f42d4f). Mark [x] only after implemented AND suite green.

## Block 1 — Git hygiene (L partial)
- [x] 98 nupkgs committed in local-feed → untrack + gitignore (nupkgs/, local-feed/)
- [x] 99 pre-scrub branches → bundle offline (outside repo) + delete local
- [x] 100 delete merged branch mine/submission-gate
- [x] 101 commit untracked .aerofortress items; ignore tool-compiler-*.{jsonl,json}
- [x] 102 remove tracked dead .redesign-*.mjs

## Block 2 — Core (A)
- [x] 1 defineVerification threshold governs the gate
- [x] 2 Verdict exposes applicable/passed (no vacuous-green ambiguity)
- [x] 3 unexpected error keeps stack/evidence; non-Error throws safe
- [x] 4 per-criterion + total durationMs in verdict
- [x] 5 formatVerdict shows skip reasons
- [x] 6 archetype(): reentrancy guard + duplicate criterion id throw
- [x] 7 custom conditions (open ConditionId union) + params usable
- [x] 8 verdict carries archetype version + protocolVersion
- [x] 9 canonical JSON form of Verdict (helper + doc)
- [x] 10 JudgeVerdict optional model/confidence, filled by claudeJudge

## Block 3 — Judge (B)
- [x] 11 memoize client
- [x] 12 1 retry with backoff on transient failure
- [x] 13 configurable timeout
- [x] 14 ./judge subpath export (comment truth)
- [x] 15 maxTokens/system configurable
- [x] 16 structured-output param verified against SDK

## Block 4 — Adapter React (C)
- [x] 17 shared settle() helper; waitFor-based (kill 26 magic sleeps)
- [x] 18 drive() resets MSW handlers at start
- [x] 19 endpointHits filters by path too
- [x] 20 onUnhandledRequest: 'warn'
- [x] 21 identity: fail loudly when switchControl missing
- [x] 22 stub boilerplate → notApplicable() factory
- [x] 23 noFalseSuccess gated (requires successMarker seam awareness)
- [x] 24 temporal: declarable date readout seam (role/testid) + multi-date safe
- [x] 25 typed Registry — remove `as never` casts (all 3 registries)
- [x] 26 options.hooks override precedence documented/explicit
- [x] 27 export missing subject types from adapter-react/index
- [x] 28 double-activate synced on state, not delay race

## Block 5 — Adapter HTTP (D)
- [x] 29 single http helper module (kill 7 duplicates)
- [x] 30 timeout/AbortSignal on all fetches
- [x] 31 JSON parse failure surfaces as evidence
- [x] 32 serverIsAuthoritative structural compare
- [x] 33 random idempotency keys per run
- [x] 34 second-order asserts trigger success
- [x] 35 second-order before/after inbox delta
- [x] 36 money: empty totals explicit error
- [x] 37 judge/gatherEvidence plumbed through http hooks options
- [x] 38 refusal = rejectWith list (default 401/403/404); 5xx never a refusal

## Block 6 — Adapter Design (E)
- [x] 39 computed-style fallback for token checks
- [x] 40 injectable token scale/themes (options seam)
- [x] 41 normColor: rgba/hsl/named/oklch
- [x] 42 contrast composites alpha over bg
- [x] 43 AA/AAA threshold option
- [x] 44 geometry tier exported (design/browser entry)
- [x] 45 chrome detection: LOCALAPPDATA/Brave/Chromium
- [x] 46 goto timeout option + actionable error
- [x] 47 loadMarkup custom css/font hook
- [x] 48 verifyDesign hooks escape hatch
- [x] 49 verifyDesignBrowser hooks + judge options

## Block 7 — Protocol (F)
- [x] 50 PROTOCOL.md adds double-activate
- [x] 51 doc-drift guard for PROTOCOL.md vocab tokens
- [x] 52 protocol-sync path via import.meta.dirname
- [x] 53 requires serialized into catalog specs
- [x] 54 PROTOCOL_VERSION bump 0.2.0 + policy note
- [x] 55 archetype description (+ substrate=machine reach) in catalog

## Block 8 — Assay.Net (G)
- [x] 56 Runner catches unexpected exceptions → Fail verdict
- [x] 57 AvpFailException carries evidence → verdict
- [x] 58 C# model: SeenIn, Condition.Params, ConditionAxes, Requires
- [x] 59 design-catalog embedded + LoadDesignDefault
- [x] 60 HttpClient explicit timeout
- [x] 61 Refused accepts custom reject list
- [x] 62 Guid idempotency keys
- [x] 63 ConformanceTests via reflection
- [x] 64 xUnit1013 fixed
- [x] 65 Verdict merge helper (submission-gate pair)
- [x] 66 SpecManifest × verdicts gap checker
- [x] 67 SpecManifest parser exact-key match + limits doc
- [x] 68 CancellationToken on Runner.Run
- [x] 69 progress callback on Runner.Run
- [x] 70 FormatVerdict .NET
- [x] (64b) zero-warning build kept

## Block 9 — Bench (H)
- [x] 71 accuracy number derived without re-running
- [x] 72 shared pair-harness helper for benches
- [x] 73 accuracy numbers persisted (bench/results JSONL)
- [x] 74 quiet expected mutant console noise
- [x] 75 geometry: honest visible skip without Chrome + CI job with Chrome
- [x] 76 tools/measure — re-measure + history artifact (convergence data)

## Block 10 — eslint-plugin (I)
- [x] 77 per-directory cache (mtime invalidation)
- [x] 78 comment-stripping before match + renamed-import note
- [x] 79 publishable package.json + distribution story
- [x] 80 glob subset documented

## Block 11 — escape-miner (J)
- [x] 81 sln regex typo removed
- [x] 82 multi-label classify (primary + all)
- [x] 83 streaming git log (no 256MB sync buffer)

## Block 12 — CLI (K)
- [x] 84 default *.assay.* filter
- [x] 85 no shell:true; resolve local vitest; safe args
- [x] 86 --help/--version/--json passthrough

## Block 13 — Packaging/CI (L rest)
- [x] 87 ci.yml: vitest + tsc + lint + dotnet test on push/PR
- [x] 88 publish gated on tests + version==tag assertion
- [x] 89 versions synced (JS+NET → 0.2.0) + policy in workflow
- [x] 90 npm provenance + permissions
- [x] 91 actions pinned by SHA
- [x] 92 RTL/user-event/msw → optional peers
- [x] 93 sideEffects:false + engines
- [x] 94 exports: ./judge + ./design/browser
- [x] 95 LICENSE in npm tarball
- [x] 96 root README quickstart fixed (cd assay)
- [x] 97 README rewritten to current state
- [x] 103 eslint flat config + prettier check + .editorconfig; lint script
- [x] 104 dependabot + SECURITY + CONTRIBUTING + CHANGELOG
- [x] 105 tsup target + ESM-only documented
- [x] 106 example imports @aerofortress/assay (+ vite comment fix)
- [x] 107 example PATCH validates body
- [x] 108 publish npm ci --workspaces=false

## Block 14 — Docs (M)
- [x] 109 assay-net.md refreshed (0.2.0 reality)
- [x] 110 LZ* → AF* sweep in docs
- [x] 111 catalog.md status table covers backend archetypes
- [x] 112 CONTEXT.md: substrate/seam/probe/judge/version terms
- [x] 113 PROTOCOL.md: unexpected-error + skip-exception semantics
- [x] 114 ADR 0002 notes design hatch
- [x] 115 transfer/mutation numbers dated + refreshed
- [x] 116 docs/getting-started.md (react/http/design)
- [x] 117 CLI documented honestly

## Block 15 — Science (N)
- [x] 118 caos→verde loop harness (bench/loop-closure)
- [x] 119 convergence artifact generator (with 73/76)
- [x] 120 transfer one-command story (CLI + transfer.md)
- [x] 121 clock-not-frozen explicit in status table
- [x] 122 cross-screen projection seam + calibration
- [x] 123 live judge calibration test (env-gated)
- [x] 124 composeVerdicts (feature verdict) TS + .NET merge
- [x] 125 determinism harness (N-run variance report)
