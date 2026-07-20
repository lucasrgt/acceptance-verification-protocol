#!/usr/bin/env node
// Thin face: `assay verify` runs your co-located *.assay.test.* verifications on the host
// runner (Vitest) — a wrapper over the host, not a runner of its own (ADR 0001).
//
//   assay verify                 # every *.assay.test.* file in the project
//   assay verify src/features    # scoped to paths you pass
//   assay verify --json          # vitest's JSON reporter (machine-readable results)
//   assay verify -- --coverage   # anything after -- goes to vitest untouched
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const version = JSON.parse(readFileSync(join(here, '../package.json'), 'utf8')).version;

const USAGE = `assay ${version} — the AVP reference verifier (thin wrapper over Vitest)

usage:
  assay verify [paths...] [--json] [-- <vitest args>]

  Runs the *.assay.test.* verification files (authored with defineVerification) through
  your project's Vitest. Paths scope the run; --json switches to Vitest's JSON
  reporter; everything after -- is handed to Vitest verbatim.

  assay --version | -v
  assay --help    | -h
`;

const argv = process.argv.slice(2);
const [cmd, ...rest] = argv;

if (cmd === '--version' || cmd === '-v') {
  console.log(version);
  process.exit(0);
}
if (cmd === undefined || cmd === '--help' || cmd === '-h' || cmd !== 'verify') {
  const bad = cmd !== undefined && cmd !== '--help' && cmd !== '-h';
  (bad ? console.error : console.log)(USAGE);
  process.exit(bad ? 2 : 0);
}

const passthroughAt = rest.indexOf('--');
const own = passthroughAt === -1 ? rest : rest.slice(0, passthroughAt);
const passthrough = passthroughAt === -1 ? [] : rest.slice(passthroughAt + 1);
const json = own.includes('--json');
const paths = own.filter((a) => a !== '--json');

// Resolve the PROJECT's vitest (never a floating npx download): the verification runs
// on the host runner the project already pins.
const require = createRequire(join(process.cwd(), 'package.json'));
let vitestBin;
try {
  vitestBin = join(dirname(require.resolve('vitest/package.json')), 'vitest.mjs');
} catch {
  console.error('assay: vitest not found in this project — `npm i -D vitest` (Assay rides the host runner; ADR 0001).');
  process.exit(2);
}

// Vitest filters files by positional substring match. Default: the co-location
// convention (Vitest-discoverable test files containing ".assay."). Explicit paths replace the default —
// they are the caller's scope, verbatim.
const filters = paths.length > 0 ? paths : ['.assay.'];
const args = [
  vitestBin,
  'run',
  ...filters,
  ...(json ? ['--reporter', 'json'] : []),
  ...passthrough,
];

// No shell: args go to node verbatim (paths with spaces survive; nothing to inject).
const res = spawnSync(process.execPath, args, { stdio: 'inherit' });
process.exit(res.status ?? 1);
