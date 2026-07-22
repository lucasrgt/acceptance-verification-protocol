#!/usr/bin/env node
// Runs both implementations, records every executed JS calibration line, audits the
// catalog-to-test references across JS and .NET, and derives the JSON + Markdown history.
import { execFileSync, execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, '../..');
const repoRoot = resolve(pkgRoot, '..');
const resultsFile = resolve(pkgRoot, 'bench/results/latest.jsonl');
const historyFile = resolve(repoRoot, 'docs/measurements.json');
const tableFile = resolve(repoRoot, 'docs/measurements.md');
const checkOnly = process.argv.includes('--check');

function run(file, args, cwd, env = process.env) {
  execFileSync(file, args, {
    cwd,
    stdio: 'inherit',
    env,
  });
}

function sourceFiles(root, extensions) {
  const found = [];
  for (const entry of readdirSync(root)) {
    const path = resolve(root, entry);
    if (statSync(path).isDirectory()) found.push(...sourceFiles(path, extensions));
    else if (extensions.has(extname(path))) found.push(path);
  }
  return found;
}

rmSync(resultsFile, { force: true });

console.log('measure: running every JS calibration (ASSAY_RECORD=1)…');
run(
  process.execPath,
  [resolve(pkgRoot, 'node_modules/vitest/vitest.mjs'), 'run'],
  pkgRoot,
  { ...process.env, ASSAY_RECORD: '1' },
);

console.log('measure: running the .NET conformance and calibration suite…');
run('dotnet', ['test', '--nologo', '-warnaserror'], resolve(repoRoot, 'assay.net'));

if (!existsSync(resultsFile)) {
  throw new Error('No JS calibration records were produced. The measurement is inconclusive.');
}

const records = readFileSync(resultsFile, 'utf8')
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line))
  .sort((a, b) => a.label.localeCompare(b.label));
const total = records.reduce((sum, row) => sum + row.total, 0);
const detected = records.reduce((sum, row) => sum + row.detection, 0);
const falseAlarms = records.reduce((sum, row) => sum + row.falseAlarms, 0);
if (detected !== total || falseAlarms !== 0) {
  throw new Error(`Calibration failed: detected=${detected}/${total}, falseAlarms=${falseAlarms}.`);
}

const catalog = JSON.parse(readFileSync(resolve(repoRoot, 'protocol/catalog.json'), 'utf8'));
const design = JSON.parse(readFileSync(resolve(repoRoot, 'protocol/design-catalog.json'), 'utf8'));
const catalogArchetypes = [...catalog.archetypes, ...design.archetypes];
const criterionIds = catalogArchetypes.flatMap((archetype) => archetype.criteria.map((criterion) => criterion.id));
const testFiles = [
  ...sourceFiles(resolve(pkgRoot, 'bench'), new Set(['.ts', '.tsx'])),
  ...sourceFiles(resolve(pkgRoot, 'test'), new Set(['.ts', '.tsx', '.mjs'])),
  ...sourceFiles(resolve(repoRoot, 'assay.net/tests'), new Set(['.cs'])),
];
const testSources = testFiles.map((path) => ({ path, text: readFileSync(path, 'utf8') }));
const missingReferences = criterionIds.filter(
  (id) => !testSources.some(({ text }) => text.includes(`'${id}'`) || text.includes(`"${id}"`) || text.includes(`\`${id}\``)),
);
if (missingReferences.length > 0) {
  throw new Error(`Catalog criteria absent from executable tests: ${missingReferences.join(', ')}`);
}

const sha = execSync('git rev-parse --short HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
const dirty = execSync('git status --porcelain', { cwd: repoRoot, encoding: 'utf8' }).trim() !== '';
const revision = dirty ? `${sha}+worktree` : sha;
const measurement = {
  date: new Date().toISOString().slice(0, 10),
  commit: revision,
  archetypes: catalogArchetypes.length,
  criteria: criterionIds.length,
  criteriaReferencedByTests: criterionIds.length - missingReferences.length,
  calibrationGroups: records.length,
  pairs: total,
  detected,
  falseAlarms,
  calibrations: records.map(({ ts: _ts, ...record }) => record),
};

const history = existsSync(historyFile) ? JSON.parse(readFileSync(historyFile, 'utf8')) : [];
const nextHistory = [
  ...history.filter((entry) => entry.commit !== sha && entry.commit !== revision),
  measurement,
];
if (checkOnly) {
  const baseline = history.at(-1);
  if (!baseline) {
    throw new Error('No versioned measurement baseline exists. Run `npm run measure` first.');
  }

  const scientificEvidence = ({ date: _date, commit: _commit, ...evidence }) => evidence;
  const expected = scientificEvidence(baseline);
  const actual = scientificEvidence(measurement);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      'Executed measurement differs from docs/measurements.json. Run `npm run measure`, review the evidence, and commit it.',
    );
  }
  console.log('measure: executed evidence matches the versioned baseline');
} else {
  mkdirSync(dirname(historyFile), { recursive: true });
  writeFileSync(historyFile, JSON.stringify(nextHistory, null, 2) + '\n');

  const rows = nextHistory.map((entry) =>
    `| ${entry.date} | ${entry.commit} | ${entry.archetypes} | ${entry.criteria} | ${entry.criteriaReferencedByTests ?? 'n/a'} | ${entry.calibrationGroups ?? 'n/a'} | ${entry.pairs} | ${entry.detected} | ${entry.falseAlarms} |`,
  );
  writeFileSync(
    tableFile,
    `# Measurements — the convergence table

Each row is generated by \`node tools/measure/measure.mjs\` from \`assay/\`. The
command runs the complete JS and .NET gates, records every executed JS good/bad
calibration group, and verifies that every catalog criterion is referenced by executable
test code. "Referenced" is deliberately not called calibrated: only the executed pair
columns support detection and false-alarm claims. The JSON source beside this file keeps
the per-group evidence. CI reruns the same measurement in check mode and rejects drift
from the versioned evidence.

| date | commit | archetypes | criteria | test-referenced | calibration groups | pairs | detected | false alarms |
|---|---|---|---|---|---|---|---|---|
${rows.join('\n')}
`,
  );
}

console.log(
  `measure: ${records.length} groups, ${detected}/${total} pairs detected, ${falseAlarms} false alarms, ${criterionIds.length}/${criterionIds.length} criteria test-referenced`,
);
