import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog, buildDesignCatalog, CONDITION_AXES, ORACLE_KINDS, SUBSTRATES } from '../src/protocol';

/**
 * The drift guard — the reason the protocol can never fall behind the lib. It
 * rebuilds each protocol catalog from the shipped archetypes and asserts it equals
 * the committed artifact. Add a criterion to the lib without updating the artifact →
 * this test goes RED. Regenerate both with:
 *   ASSAY_WRITE_PROTOCOL=1 npx vitest run protocol-sync
 */
// Anchored to THIS file (never process.cwd()) so the guard holds from any runner cwd.
const here = dirname(fileURLToPath(import.meta.url));

const CATALOGS = [
  // protocol/ lives at the monorepo ROOT (the neutral, shared contract).
  { file: resolve(here, '../../protocol/catalog.json'), build: buildCatalog },
  { file: resolve(here, '../../protocol/design-catalog.json'), build: buildDesignCatalog },
] as const;

describe('AVP protocol — drift guard', () => {
  it.each(CATALOGS)('$file is in lockstep with the shipped archetypes', ({ file, build }) => {
    const built = JSON.stringify(build(), null, 2) + '\n';
    if (process.env.ASSAY_WRITE_PROTOCOL) writeFileSync(file, built);
    const onDisk = readFileSync(file, 'utf8');
    expect(
      onDisk,
      `${file} is behind the lib — regenerate: ASSAY_WRITE_PROTOCOL=1 npx vitest run protocol-sync`,
    ).toBe(built);
  });

  it('docs/PROTOCOL.md names every vocabulary token the lib ships (prose drift guard)', () => {
    const prose = readFileSync(resolve(here, '../../docs/PROTOCOL.md'), 'utf8');
    const tokens = [
      ...Object.values(CONDITION_AXES).flat(),
      ...ORACLE_KINDS,
      ...SUBSTRATES,
    ];
    const missing = tokens.filter((t) => !prose.includes(t));
    expect(
      missing,
      `docs/PROTOCOL.md does not mention: ${missing.join(', ')} — the prose vocabulary lags the lib.`,
    ).toEqual([]);
  });
});
