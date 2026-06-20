import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';

/**
 * The snowball guard — structural discipline borrowed from lazuli-lang's
 * "every source file ≤ 500 LOC" rule (production AND test, no exceptions). A file
 * past the ceiling is the signal to SPLIT by concern, not to keep packing. Enforced
 * here so the discipline can't erode as the protocol grows — the same philosophy as
 * the protocol drift guard: make it red, don't make it a hope.
 *
 * If this fails: split the file into a folder with a thin barrel `index.ts`
 * (re-exporter, not a kitchen sink) + siblings each named for the concern it owns.
 */
const CAP = 500;
const ROOTS = ['src', 'bench', 'tools', 'eslint-plugin-assay', 'examples/todo-app/src', 'examples/todo-app/assay'];
const EXT = new Set(['.ts', '.tsx', '.cjs', '.mjs']);
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
    else if (EXT.has(extname(e.name))) out.push(full);
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
