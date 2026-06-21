# escape-miner (tier-1)

Turn any git repo's fix history into a classified escape corpus — the scalable
evidence layer behind `docs/catalog.md` / `docs/corpus-multistack.md`.

```
node tools/escape-miner/mine.cjs <repo-path> [label]
```

Walks `git log`, keeps fix-shaped commits, classifies each by archetype from
message + changed-file signals, prints a per-archetype table + a `[MINE]` machine
line. Reads only git, mutates nothing; works on a blobless/no-checkout clone:

```
git clone --filter=blob:none --no-checkout --single-branch <url> <dir>
node tools/escape-miner/mine.cjs <dir> <label>
```

**Tier-1 = keyword-heuristic, deliberately noisy.** It classifies the clearly
labelled fixes (~8–15%); the rest are `unclassified`. Counts are a *lower bound*
and some rows are false positives — the signal is the distribution across repos,
not any single row. Tier-1.5 (diff-based / LLM classification) is the upgrade.
