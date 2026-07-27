#!/usr/bin/env node
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MINIMUM_LINE_COVERAGE = 95;
const MAX_PRODUCTION_LINES = 7000;
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const repositoryRoot = resolve(packageRoot, '..');
const npmCli = process.env.npm_execpath;

function fail(message) {
  throw new Error(message);
}

function run(label, program, args, cwd = packageRoot) {
  console.log(`\n[${label}] ${program} ${args.join(' ')}`);
  const result = spawnSync(program, args, { cwd, stdio: 'inherit' });
  if (result.error) fail(`could not start ${program}: ${result.error.message}`);
  if (result.status !== 0) fail(`${label} failed with exit code ${result.status ?? 'unknown'}`);
}

function runNpm(label, args, cwd = packageRoot) {
  if (npmCli) {
    run(label, process.execPath, [npmCli, ...args], cwd);
    return;
  }
  run(label, process.platform === 'win32' ? 'npm.cmd' : 'npm', args, cwd);
}

function capture(program, args, cwd = repositoryRoot) {
  const result = spawnSync(program, args, { cwd, encoding: 'utf8' });
  if (result.error) fail(`could not start ${program}: ${result.error.message}`);
  if (result.status !== 0) fail(`${program} failed: ${(result.stderr || result.stdout).trim()}`);
  return result.stdout;
}

function productionLineGate() {
  const roots = [
    'assay/src',
    'assay/bin',
    'assay/eslint-plugin-assay/index.cjs',
    'assay/eslint-plugin-assay/scan.cjs',
    'assay.net/src/Assay.Net',
  ];
  console.log(`\n[production lines] tokei ${roots.join(' ')}`);
  const report = JSON.parse(capture('tokei', [...roots, '--output', 'json']));
  const lines = ['TypeScript', 'TSX', 'JavaScript', 'C#']
    .reduce((total, language) => total + (report[language]?.code ?? 0), 0);
  if (lines > MAX_PRODUCTION_LINES) {
    fail(`production line budget exceeded: ${lines}/${MAX_PRODUCTION_LINES}`);
  }
  console.log(`production lines: ${lines}/${MAX_PRODUCTION_LINES}`);
}

function findCoverageFile(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      const found = findCoverageFile(path);
      if (found) return found;
    } else if (entry.name === 'coverage.cobertura.xml') {
      return path;
    }
  }
  return null;
}

function attribute(xml, name) {
  const match = xml.match(new RegExp(`${name}="(\\d+)"`));
  if (!match) fail(`Cobertura report has no ${name} attribute`);
  return Number(match[1]);
}

function dotnetCoverageGate() {
  const results = mkdtempSync(join(tmpdir(), 'avp-dotnet-coverage-'));
  try {
    run(
      '.NET tests and coverage',
      'dotnet',
      [
        'test',
        'assay.net/Assay.Net.slnx',
        '-c',
        'Release',
        '--collect:XPlat Code Coverage',
        '--results-directory',
        results,
      ],
      repositoryRoot,
    );
    const path = findCoverageFile(results);
    if (!path) fail('dotnet test produced no Cobertura coverage report');
    const xml = readFileSync(path, 'utf8');
    const covered = attribute(xml, 'lines-covered');
    const valid = attribute(xml, 'lines-valid');
    if (valid === 0) fail('dotnet coverage report contains no production lines');
    if (covered * 100 < valid * MINIMUM_LINE_COVERAGE) {
      fail(`Assay.Net line coverage is ${(covered * 100 / valid).toFixed(2)}%; minimum is ${MINIMUM_LINE_COVERAGE}%`);
    }
    console.log(`Assay.Net line coverage: ${covered}/${valid} (${(covered * 100 / valid).toFixed(2)}%)`);
  } finally {
    rmSync(results, { recursive: true, force: true });
  }
}

function main() {
  console.log('AVP repository verification');
  runNpm('typecheck', ['run', 'typecheck']);
  runNpm('lint', ['run', 'lint']);
  productionLineGate();
  runNpm('JavaScript tests and coverage', ['run', 'test:coverage']);
  runNpm('scientific measurement', ['run', 'measure:check']);
  runNpm('packaged entrypoints', ['run', 'test:package']);
  run('ESLint plugin self-test', process.execPath, ['eslint-plugin-assay/index.test.cjs']);
  run(
    'Assay CLI example',
    process.execPath,
    ['../../bin/assay.mjs', 'verify'],
    resolve(packageRoot, 'examples/todo-app'),
  );
  dotnetCoverageGate();
  console.log('\nverify passed');
}

try {
  main();
} catch (error) {
  console.error(`\nverify failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
