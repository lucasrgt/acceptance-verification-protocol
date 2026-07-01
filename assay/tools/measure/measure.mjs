#!/usr/bin/env node
// Re-measures the verifier's accuracy and appends one row to the CONVERGENCE TABLE
// (docs/measurements.md) — the reproducible artifact behind the scientific claim
// ("the dictionary converges by escape accrual"). Console numbers evaporate; this
// file is the history.
//
//   node tools/measure/measure.mjs        # run the bench, append a dated row
//
// Mechanics: runs the vitest bench with ASSAY_RECORD=1 (each pairAccuracy() bench
// appends NDJSON to bench/results/latest.jsonl), aggregates it, and appends
// date | git sha | criteria in catalog | pairs | detected | false alarms.
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, '../..');
const resultsFile = resolve(pkgRoot, 'bench/results/latest.jsonl');
const tableFile = resolve(pkgRoot, '../docs/measurements.md');

rmSync(resultsFile, { force: true });

console.log('measure: running the accuracy bench (ASSAY_RECORD=1)…');
execFileSync('npx', ['vitest', 'run', 'bench'], {
  cwd: pkgRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, ASSAY_RECORD: '1' },
});

if (!existsSync(resultsFile)) {
  console.error('measure: no datapoints were recorded — did the harness-based benches run?');
  process.exit(1);
}

const rows = readFileSync(resultsFile, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const total = rows.reduce((n, r) => n + r.total, 0);
const detected = rows.reduce((n, r) => n + r.detection, 0);
const falseAlarms = rows.reduce((n, r) => n + r.falseAlarms, 0);

const catalog = JSON.parse(readFileSync(resolve(pkgRoot, '../protocol/catalog.json'), 'utf8'));
const design = JSON.parse(readFileSync(resolve(pkgRoot, '../protocol/design-catalog.json'), 'utf8'));
const criteria = [...catalog.archetypes, ...design.archetypes].reduce((n, a) => n + a.criteria.length, 0);
const archetypes = catalog.archetypes.length + design.archetypes.length;

const sha = execSync('git rev-parse --short HEAD', { cwd: pkgRoot, encoding: 'utf8' }).trim();
const date = new Date().toISOString().slice(0, 10);
const row = `| ${date} | ${sha} | ${archetypes} | ${criteria} | ${total} | ${detected} | ${falseAlarms} |`;

if (!existsSync(tableFile)) {
  mkdirSync(dirname(tableFile), { recursive: true });
  writeFileSync(
    tableFile,
    `# Measurements — the convergence table

Each row is one full run of the verifier-accuracy bench (\`node tools/measure/measure.mjs\`
from \`assay/\`): the catalog size at that commit and the ruler's calibration over the
executed (good, bad) pairs. The claim this table carries: criteria accrue from escapes,
and detection holds at zero false alarms as the dictionary grows.

| date | commit | archetypes | criteria | pairs | detected | false alarms |
|---|---|---|---|---|---|---|
`,
  );
}
appendFileSync(tableFile, row + '\n');
console.log(`measure: appended → ${row}`);
