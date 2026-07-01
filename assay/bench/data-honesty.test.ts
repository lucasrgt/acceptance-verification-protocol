import type { ReactElement } from 'react';
import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { dataHonesty } from '../src/archetypes/data-honesty';
import type { DataHonestySubject } from '../src/adapter-react/data-honesty';
import { GoodFeed, BadFeed } from './dataset/listing-feed';

/**
 * The second archetype's accuracy benchmark. Same calibration discipline as
 * action-effect: fail the bad, pass the good. Green here also proves the neutral
 * core runs a genuinely different archetype (no action, no draft — a render vs an
 * API response) through the same runner.
 */
const API = 'http://localhost/api';

const feed = (render: () => ReactElement): DataHonestySubject => ({
  name: 'listing-feed',
  render,
  endpoint: { method: 'GET', path: `${API}/listings` },
  items: { role: 'article' },
  emptyResponse: [],
  mediaResponse: [{ id: 'r-1', title: 'Real Listing', coverUrl: null }],
  fabricationMarkers: ['images.unsplash.com', 'i.pravatar.cc'],
});

const cases = [
  { criterion: 'no-fixture-fallback', source: '8ec5dae5' },
  { criterion: 'no-fabricated-media', source: 'dfb23261' },
];

describe('AVP — verifier accuracy (data-honesty)', () => {
  for (const c of cases) {
    it(`fails the BAD feed on "${c.criterion}" (escape ${c.source})`, async () => {
      const v = await verify(dataHonesty, feed(BadFeed));
      const target = v.results.find((r) => r.criterionId === c.criterion);
      expect(target, `criterion ${c.criterion} missing`).toBeDefined();
      expect(target?.status, target?.reason).toBe('fail');
    });
  }

  it('passes the GOOD feed with no false alarm', async () => {
    const v = await verify(dataHonesty, feed(GoodFeed));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the data-honesty accuracy number', async () => {
    const bad = await verify(dataHonesty, feed(BadFeed));
    const good = await verify(dataHonesty, feed(GoodFeed));
    const detected = cases.filter(
      (c) => bad.results.find((r) => r.criterionId === c.criterion)?.status === 'fail',
    ).length;
    const falseAlarms = good.results.filter((r) => r.status === 'fail').length;
     
    console.log(`\n[AVP] data-honesty detection=${detected}/${cases.length}  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(cases.length);
    expect(falseAlarms).toBe(0);
  });
});
