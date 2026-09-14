import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

/**
 * The snowball guard: every maintained production source file stays at or below
 * 500 tokei *code* lines. Tests are intentionally unlimited. A production file
 * past the ceiling is the signal to split by concern, not to keep packing.
 */
const CAP = 500;
const ROOTS = ['src', 'bin', 'eslint-plugin-assay', '../assay.net/src/Assay.Net'];

describe('AVP source discipline — ≤500 tokei code lines per file', () => {
  it('no production file exceeds the tokei code ceiling', () => {
    const cwd = resolve(process.cwd(), '..');
    const args = [...ROOTS.map((root) => resolve(process.cwd(), root)), '--output', 'json'];
    const result = spawnSync('tokei', args, { cwd: process.cwd(), encoding: 'utf8' });
    expect(result.status, result.stderr || result.stdout).toBe(0);
    const report = JSON.parse(result.stdout);
    const offenders = ['TypeScript', 'TSX', 'JavaScript', 'C#']
      .flatMap((language) =>
        (report[language]?.reports ?? []).map((item: { name: string; stats: { code: number } }) => ({
          file: item.name.replace(/\\/g, '/'),
          loc: item.stats.code,
        })),
      )
      .filter((item) => item.loc > CAP)
      .sort((a, b) => b.loc - a.loc);
    expect(offenders, `files over ${CAP} tokei code lines — split by concern:\n${JSON.stringify(offenders, null, 2)}`).toHaveLength(0);
  });
});
