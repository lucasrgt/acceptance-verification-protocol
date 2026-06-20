---
id: 64edaf6a-6b33-4278-828f-cd45e6d0ef71
slug: geral
type: rule
title: No AI co-authorship trailers in commits
tags: git, commits, preference, no-attribution
provenance: dito
evidence: 
decay: stable
created: 2026-06-20T15:57:45.641810800+00:00
updated: 2026-06-20T15:57:45.641810800+00:00
validated: 2026-06-20T15:57:45.641810800+00:00
links: 
---

User rule (dito, 2026-06-20): NEVER add an AI co-authorship trailer to git commits — no `Co-Authored-By: Claude`, no Codex, no any AI tool. Applies to ALL the user's repos, including this one (avp/Assay).

**Why:** "o pessoal ainda olha com maus olhos" — AI attribution in commit history is still viewed negatively by peers/reviewers; clean human authorship is wanted.

**How to apply:** This OVERRIDES the default harness instruction that appends `Co-Authored-By: Claude …`. Write commit messages (and PR bodies, by extension) with no co-author/attribution trailer — just the message, nothing identifying an AI as author.

The public repo's release commit (github.com/lucasrgt/acceptance-verification-protocol, main @ f7c2337) was already amended to remove it.
