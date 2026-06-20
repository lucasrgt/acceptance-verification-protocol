import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildCatalog } from '../src/protocol';

/**
 * The drift guard — the reason the protocol can never fall behind the lib. It
 * rebuilds the protocol catalog from the shipped archetypes and asserts it equals
 * the committed `protocol/catalog.json`. Add a criterion to the lib without
 * updating the protocol artifact → this test goes RED. Regenerate with:
 *   ASSAY_WRITE_PROTOCOL=1 npx vitest run protocol-sync
 */
const FILE = resolve(process.cwd(), 'protocol/catalog.json');

describe('AVP protocol — drift guard', () => {
  it('protocol/catalog.json is in lockstep with the shipped archetypes', () => {
    const built = JSON.stringify(buildCatalog(), null, 2) + '\n';
    if (process.env.ASSAY_WRITE_PROTOCOL) writeFileSync(FILE, built);
    const onDisk = readFileSync(FILE, 'utf8');
    expect(
      onDisk,
      'protocol/catalog.json is behind the lib — regenerate: ASSAY_WRITE_PROTOCOL=1 npx vitest run protocol-sync',
    ).toBe(built);
  });
});
