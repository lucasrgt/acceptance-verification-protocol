---
id: 1d79047e-b714-4321-be27-786ea3eb6987
slug: geral
type: project
title: Git RESOLVED — history scrubbed of the anonymization map, pushed clean to public origin
tags: 
provenance: observado
evidence: git log -p main | grep -ci private-names = 0; git push origin main → f7c2337..e5a1c99 fast-forward; git diff backup-pre-scrub main --stat empty; tsc clean
decay: stable
created: 2026-06-20T17:37:53.853813100+00:00
updated: 2026-06-20T17:37:53.853813100+00:00
validated: 2026-06-20T17:37:53.853813100+00:00
links: 
---

The pending git issue (from iterations 4–12) is RESOLVED. The 12 post-release commits (f7c2337..HEAD, the full runtime-catalog work) were rewritten with `git filter-branch --index-filter` to remove `.pleiades/items/geral/fc2e2566-...md` (the anonymization map, which by nature carries the private project names) from every commit. Verified: 0 private-name occurrences in the ENTIRE main history; the final tracked tree is byte-identical to before (only intermediate history changed); the map survives on disk (untracked + gitignored). Pushed as a clean fast-forward (NO --force): origin/main f7c2337 → e5a1c99, public at github.com/lucasrgt/acceptance-verification-protocol. No CI configured.

Safety: `backup-pre-scrub` branch holds the pre-scrub history locally — NEVER push it (it still contains the names), like `pre-public-history`. filter-branch refs/original removed + reflog expired. Future pushes: plain `git push`, the tree is clean.

This supersedes the "history scrub still pending" reminders in the earlier catalog items. [[public-repo-anonymization-map-no-private-project]]
