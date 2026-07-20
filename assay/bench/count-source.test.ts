import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { dataHonesty } from '../src/archetypes/data-honesty';
import type { DataHonestySubject } from '../src/adapter-react/data-honesty';
import { buildCountFeed, type CountVariant, type Row } from './dataset/count-feed';

/**
 * data-honesty · count-matches-source — the rendered count must equal what the API
 * returned. Faithful escape (a client-side filter/fixture merge dropping or
 * inventing rows); confirmed cross-stack in Node/TS by documenso's "api keys not
 * showing" (rows dropped) and "exclude rejected from inbox count" (count ≠ source).
 * Shares the data-honesty archetype with the fixture/media criteria, gated by seam.
 */
const ROWS: Row[] = [
  { id: 'r1', category: 'a' },
  { id: 'r2', category: 'b' },
  { id: 'r3', category: 'a' },
];

const countSubject = (variant: CountVariant): DataHonestySubject => ({
  name: `count-${variant}`,
  render: buildCountFeed(variant),
  endpoint: { method: 'GET', path: 'http://localhost/api/items' },
  items: { role: 'article' },
  emptyResponse: [],
  countResponse: ROWS,
  expectedCount: ROWS.length,
  fabricationMarkers: [],
});

const countStatus = async (variant: CountVariant) => {
  const v = await verify(dataHonesty, countSubject(variant));
  return v.results.find((r) => r.criterionId === 'count-matches-source');
};

describe('AVP — verifier accuracy (data-honesty · count-matches-source)', () => {
  it('fails the BAD feed on "count-matches-source" (dropped rows — escape documenso:b8e08e88)', async () => {
    const target = await countStatus('drop-filter');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD feed with no false alarm (other data-honesty criteria skipped by seam)', async () => {
    const v = await verify(dataHonesty, countSubject('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
    expect(v.results.find((r) => r.criterionId === 'no-fabricated-media')?.status).toBe('skipped');
  });

  it('emits the count-matches-source number', async () => {
    const detected = (await countStatus('drop-filter'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await countStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP] data-honesty count-matches-source detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for count-matches-source — distinct ways the rendered count
 * diverges from the source (drop via filter, invent via featured/pad, collapse via
 * a buggy de-dup). A robust criterion kills every one while leaving the honest GOOD
 * feed green.
 */
const MUTANTS: readonly CountVariant[] = ['drop-filter', 'inject-featured', 'pad-to-min', 'dedup-bug'];

describe('AVP — mutation testing (data-honesty · count-matches-source)', () => {
  it('kills every drop/invent mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await countStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await countStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP mutation] data-honesty · count-matches-source: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the honest feed').toBe(false);
  });
});
