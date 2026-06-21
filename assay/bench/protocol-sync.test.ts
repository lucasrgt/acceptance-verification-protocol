import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildCatalog, buildDesignCatalog } from '../src/protocol';

/**
 * The drift guard — the reason the protocol can never fall behind the lib. It
 * rebuilds each protocol catalog from the shipped archetypes and asserts it equals
 * the committed artifact. Add a criterion to the lib without updating the artifact →
 * this test goes RED. Regenerate both with:
 *   ASSAY_WRITE_PROTOCOL=1 npx vitest run protocol-sync
 */
const CATALOGS = [
  // protocol/ lives at the monorepo ROOT (the neutral, shared contract); the JS
  // package runs from assay/, so the catalogs are one level up.
  { file: resolve(process.cwd(), '../protocol/catalog.json'), build: buildCatalog },
  { file: resolve(process.cwd(), '../protocol/design-catalog.json'), build: buildDesignCatalog },
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
});
