# Audit fix progress — 125 points (2026-07-01)

Loop condition: ALL points checked. Numbers match the audit list delivered in chat
(stored as network item 82f42d4f). Mark [x] only after implemented AND suite green.

## Block 1 — Git hygiene (L partial)
- [ ] 98 nupkgs committed in local-feed → untrack + gitignore (nupkgs/, local-feed/)
- [ ] 99 pre-scrub branches → bundle offline (outside repo) + delete local
- [ ] 100 delete merged branch mine/submission-gate
- [ ] 101 commit untracked .aerofortress items; ignore tool-compiler-*.{jsonl,json}
- [ ] 102 remove tracked dead .redesign-*.mjs

## Block 2 — Core (A)
- [ ] 1 defineVerification threshold governs the gate
- [ ] 2 Verdict exposes applicable/passed (no vacuous-green ambiguity)
- [ ] 3 unexpected error keeps stack/evidence; non-Error throws safe
- [ ] 4 per-criterion + total durationMs in verdict
- [ ] 5 formatVerdict shows skip reasons
- [ ] 6 archetype(): reentrancy guard + duplicate criterion id throw
- [ ] 7 custom conditions (open ConditionId union) + params usable
- [ ] 8 verdict carries archetype version + protocolVersion
- [ ] 9 canonical JSON form of Verdict (helper + doc)
- [ ] 10 JudgeVerdict optional model/confidence, filled by claudeJudge

## Block 3 — Judge (B)
- [ ] 11 memoize client
- [ ] 12 1 retry with backoff on transient failure
- [ ] 13 configurable timeout
- [ ] 14 ./judge subpath export (comment truth)
- [ ] 15 maxTokens/system configurable
- [ ] 16 structured-output param verified against SDK

## Block 4 — Adapter React (C)
- [ ] 17 shared settle() helper; waitFor-based (kill 26 magic sleeps)
- [ ] 18 drive() resets MSW handlers at start
- [ ] 19 endpointHits filters by path too
- [ ] 20 onUnhandledRequest: 'warn'
- [ ] 21 identity: fail loudly when switchControl missing
- [ ] 22 stub boilerplate → notApplicable() factory
- [ ] 23 noFalseSuccess gated (requires successMarker seam awareness)
- [ ] 24 temporal: declarable date readout seam (role/testid) + multi-date safe
- [ ] 25 typed Registry — remove `as never` casts (all 3 registries)
- [ ] 26 options.hooks override precedence documented/explicit
- [ ] 27 export missing subject types from adapter-react/index
- [ ] 28 double-activate synced on state, not delay race

## Block 5 — Adapter HTTP (D)
- [ ] 29 single http helper module (kill 7 duplicates)
- [ ] 30 timeout/AbortSignal on all fetches
- [ ] 31 JSON parse failure surfaces as evidence
- [ ] 32 serverIsAuthoritative structural compare
- [ ] 33 random idempotency keys per run
- [ ] 34 second-order asserts trigger success
- [ ] 35 second-order before/after inbox delta
- [ ] 36 money: empty totals explicit error
- [ ] 37 judge/gatherEvidence plumbed through http hooks options
- [ ] 38 refusal = rejectWith list (default 401/403/404); 5xx never a refusal

## Block 6 — Adapter Design (E)
- [ ] 39 computed-style fallback for token checks
- [ ] 40 injectable token scale/themes (options seam)
- [ ] 41 normColor: rgba/hsl/named/oklch
- [ ] 42 contrast composites alpha over bg
- [ ] 43 AA/AAA threshold option
- [ ] 44 geometry tier exported (design/browser entry)
- [ ] 45 chrome detection: LOCALAPPDATA/Brave/Chromium
- [ ] 46 goto timeout option + actionable error
- [ ] 47 loadMarkup custom css/font hook
- [ ] 48 verifyDesign hooks escape hatch
- [ ] 49 verifyDesignBrowser hooks + judge options

## Block 7 — Protocol (F)
- [ ] 50 PROTOCOL.md adds double-activate
- [ ] 51 doc-drift guard for PROTOCOL.md vocab tokens
- [ ] 52 protocol-sync path via import.meta.dirname
- [ ] 53 requires serialized into catalog specs
- [ ] 54 PROTOCOL_VERSION bump 0.2.0 + policy note
- [ ] 55 archetype description (+ substrate=machine reach) in catalog

## Block 8 — Assay.Net (G)
- [ ] 56 Runner catches unexpected exceptions → Fail verdict
- [ ] 57 AvpFailException carries evidence → verdict
- [ ] 58 C# model: SeenIn, Condition.Params, ConditionAxes, Requires
- [ ] 59 design-catalog embedded + LoadDesignDefault
- [ ] 60 HttpClient explicit timeout
- [ ] 61 Refused accepts custom reject list
- [ ] 62 Guid idempotency keys
- [ ] 63 ConformanceTests via reflection
- [ ] 64 xUnit1013 fixed
- [ ] 65 Verdict merge helper (submission-gate pair)
- [ ] 66 SpecManifest × verdicts gap checker
- [ ] 67 SpecManifest parser exact-key match + limits doc
- [ ] 68 CancellationToken on Runner.Run
- [ ] 69 progress callback on Runner.Run
- [ ] 70 FormatVerdict .NET
- [ ] (64b) zero-warning build kept

## Block 9 — Bench (H)
- [ ] 71 accuracy number derived without re-running
- [ ] 72 shared pair-harness helper for benches
- [ ] 73 accuracy numbers persisted (bench/results JSONL)
- [ ] 74 quiet expected mutant console noise
- [ ] 75 geometry: honest visible skip without Chrome + CI job with Chrome
- [ ] 76 tools/measure — re-measure + history artifact (convergence data)

## Block 10 — eslint-plugin (I)
- [ ] 77 per-directory cache (mtime invalidation)
- [ ] 78 comment-stripping before match + renamed-import note
- [ ] 79 publishable package.json + distribution story
- [ ] 80 glob subset documented

## Block 11 — escape-miner (J)
- [ ] 81 sln regex typo removed
- [ ] 82 multi-label classify (primary + all)
- [ ] 83 streaming git log (no 256MB sync buffer)

## Block 12 — CLI (K)
- [ ] 84 default *.assay.* filter
- [ ] 85 no shell:true; resolve local vitest; safe args
- [ ] 86 --help/--version/--json passthrough

## Block 13 — Packaging/CI (L rest)
- [ ] 87 ci.yml: vitest + tsc + lint + dotnet test on push/PR
- [ ] 88 publish gated on tests + version==tag assertion
- [ ] 89 versions synced (JS+NET → 0.2.0) + policy in workflow
- [ ] 90 npm provenance + permissions
- [ ] 91 actions pinned by SHA
- [ ] 92 RTL/user-event/msw → optional peers
- [ ] 93 sideEffects:false + engines
- [ ] 94 exports: ./judge + ./design/browser
- [ ] 95 LICENSE in npm tarball
- [ ] 96 root README quickstart fixed (cd assay)
- [ ] 97 README rewritten to current state
- [ ] 103 eslint flat config + prettier check + .editorconfig; lint script
- [ ] 104 dependabot + SECURITY + CONTRIBUTING + CHANGELOG
- [ ] 105 tsup target + ESM-only documented
- [ ] 106 example imports @aerofortress/assay (+ vite comment fix)
- [ ] 107 example PATCH validates body
- [ ] 108 publish npm ci --workspaces=false

## Block 14 — Docs (M)
- [ ] 109 assay-net.md refreshed (0.2.0 reality)
- [ ] 110 LZ* → AF* sweep in docs
- [ ] 111 catalog.md status table covers backend archetypes
- [ ] 112 CONTEXT.md: substrate/seam/probe/judge/version terms
- [ ] 113 PROTOCOL.md: unexpected-error + skip-exception semantics
- [ ] 114 ADR 0002 notes design hatch
- [ ] 115 transfer/mutation numbers dated + refreshed
- [ ] 116 docs/getting-started.md (react/http/design)
- [ ] 117 CLI documented honestly

## Block 15 — Science (N)
- [ ] 118 caos→verde loop harness (bench/loop-closure)
- [ ] 119 convergence artifact generator (with 73/76)
- [ ] 120 transfer one-command story (CLI + transfer.md)
- [ ] 121 clock-not-frozen explicit in status table
- [ ] 122 cross-screen projection seam + calibration
- [ ] 123 live judge calibration test (env-gated)
- [ ] 124 composeVerdicts (feature verdict) TS + .NET merge
- [ ] 125 determinism harness (N-run variance report)
