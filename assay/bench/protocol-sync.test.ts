import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog, buildDesignCatalog, CONDITION_AXES, ORACLE_KINDS, SUBSTRATES } from '../src/protocol';

/**
 * The conformance guard — the catalog is .NET-LED since the authority handover
 * (assay.net/src/Assay.Net/CatalogSource.cs is where criteria are born; its CatalogSync
 * guard owns the artifact's bytes). This side has NO write path by design: the shipped JS
 * archetypes must CONFORM to the committed artifact. Red here means the implementations
 * disagree — evolve the contract in CatalogSource.cs first, regenerate with
 *   ASSAY_WRITE_PROTOCOL=1 dotnet test --filter CatalogSync   (from assay.net/),
 * then bring the JS archetypes into lockstep.
 */
// Anchored to THIS file (never process.cwd()) so the guard holds from any runner cwd.
const here = dirname(fileURLToPath(import.meta.url));

const CATALOGS = [
  // protocol/ lives at the monorepo ROOT (the neutral, shared contract).
  { file: resolve(here, '../../protocol/catalog.json'), build: buildCatalog },
  { file: resolve(here, '../../protocol/design-catalog.json'), build: buildDesignCatalog },
] as const;

describe('AVP protocol — conformance to the .NET-led catalog', () => {
  it.each(CATALOGS)('the shipped archetypes conform to $file', ({ file, build }) => {
    // Parsed (content) equality, not byte equality: the .NET emitter owns the bytes; the
    // mirror conforms on content — and stays green under any checkout EOL policy.
    const committed = JSON.parse(readFileSync(file, 'utf8'));
    const built = JSON.parse(JSON.stringify(build()));
    expect(
      built,
      `${file} and the JS archetypes disagree — the catalog is .NET-led: evolve CatalogSource.cs, regenerate (ASSAY_WRITE_PROTOCOL=1 dotnet test --filter CatalogSync), then match the JS archetypes to it.`,
    ).toEqual(committed);
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
