#!/usr/bin/env node
// Measures the DETERMINISM of the verifier itself — the thesis in a number. Runs the
// calibration bench N times and diffs the per-test outcomes across runs: any test that
// flips is a flake in the RULER, reported by name. Exit 0 = N identical runs.
//
//   node tools/determinism/determinism.mjs [N]   # default 3
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const runs = Math.max(2, Number(process.argv[2] ?? 3));
const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const tmp = mkdtempSync(join(tmpdir(), 'assay-determinism-'));

/** name → 'passed' | 'failed' for one full bench run (vitest JSON reporter). */
function benchOutcomes(i) {
  const out = join(tmp, `run-${i}.json`);
  try {
    execFileSync('npx', ['vitest', 'run', 'bench', '--reporter=json', `--outputFile=${out}`], {
      cwd: pkgRoot,
      stdio: ['ignore', 'ignore', 'inherit'],
      shell: process.platform === 'win32',
    });
  } catch {
    /* vitest exits nonzero when tests fail — the JSON still lands; flips are the point */
  }
  const report = JSON.parse(readFileSync(out, 'utf8'));
  const outcomes = new Map();
  for (const file of report.testResults ?? []) {
    for (const t of file.assertionResults ?? []) {
      outcomes.set(`${file.name} > ${t.fullName}`, t.status);
    }
  }
  return outcomes;
}

console.log(`determinism: running the bench ${runs}× …`);
const all = [];
for (let i = 0; i < runs; i++) {
  all.push(benchOutcomes(i));
  console.log(`  run ${i + 1}/${runs}: ${all[i].size} tests`);
}

const names = new Set(all.flatMap((m) => [...m.keys()]));
const flaky = [];
for (const name of names) {
  const seen = new Set(all.map((m) => m.get(name) ?? 'missing'));
  if (seen.size > 1) flaky.push({ name, seen: [...seen] });
}

rmSync(tmp, { recursive: true, force: true });

if (flaky.length === 0) {
  console.log(`determinism: ${names.size} tests × ${runs} runs — ZERO flips. The ruler is stable.`);
} else {
  console.error(`determinism: ${flaky.length} test(s) flipped across ${runs} runs:`);
  for (const f of flaky) console.error(`  ✗ ${f.name} → ${f.seen.join(' / ')}`);
  process.exit(1);
}
