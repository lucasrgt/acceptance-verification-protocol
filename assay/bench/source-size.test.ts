import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';

/**
 * The snowball guard: every maintained production source file stays at or below
 * 500 LOC. Tests are intentionally unlimited. A production file past the ceiling is
 * the signal to split by concern, not to keep packing.
 *
 * If this fails: split the file into a folder with a thin barrel `index.ts`
 * (re-exporter, not a kitchen sink) + siblings each named for the concern it owns.
 */
const CAP = 500;
const ROOTS = ['src', 'bin', 'eslint-plugin-assay', '../assay.net/src'];
const EXT = new Set(['.ts', '.tsx', '.cjs', '.mjs', '.cs']);
const SKIP = new Set(['node_modules', 'dist', 'build', '.pleiades', '.codegraph', 'protocol']);

function walk(dir: string, out: string[]): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (SKIP.has(e.name)) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (EXT.has(extname(e.name)) && !e.name.includes('.test.')) out.push(full);
  }
}

describe('AVP source discipline — ≤500 LOC per file', () => {
  it('no source file exceeds the LOC ceiling (split by concern instead)', () => {
    const root = process.cwd();
    const files: string[] = [];
    for (const r of ROOTS) walk(resolve(root, r), files);
    const offenders = files
      .map((f) => ({ file: f.replace(root, '').replace(/\\/g, '/'), loc: readFileSync(f, 'utf8').split('\n').length }))
      .filter((x) => x.loc > CAP)
      .sort((a, b) => b.loc - a.loc);
    expect(offenders, `files over ${CAP} LOC — split by concern:\n${JSON.stringify(offenders, null, 2)}`).toHaveLength(0);
  });
});
