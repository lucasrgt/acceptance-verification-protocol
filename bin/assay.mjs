#!/usr/bin/env node
// Thin face: `assay verify` runs your *.assay.* verifications on the host runner.
// It is a wrapper over the host (Vitest) — not a runner of its own (see ADR 0001).
import { spawnSync } from 'node:child_process';

const [cmd, ...rest] = process.argv.slice(2);

if (cmd !== 'verify') {
  console.error('usage: assay verify [paths...]   # run your verifications');
  process.exit(2);
}

const res = spawnSync('npx', ['vitest', 'run', ...rest], { stdio: 'inherit', shell: true });
process.exit(res.status ?? 1);
