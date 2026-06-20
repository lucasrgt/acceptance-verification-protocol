import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { actionEffect } from '../src/archetypes/action-effect';
import { pairs } from './pairs';

/**
 * The verifier's own accuracy benchmark. Before scoring any agent, the ruler
 * must be calibrated: does it fail the bad and pass the good? Green here = the
 * verifier works. A false-green is the catastrophic error.
 */
describe('AVP — verifier accuracy (action-effect)', () => {
  for (const pair of pairs) {
    it(`fails the BAD ${pair.name} on "${pair.targetCriterion}" (escape ${pair.source})`, async () => {
      const v = await verify(actionEffect, pair.bad);
      const target = v.results.find((r) => r.criterionId === pair.targetCriterion);
      expect(target, `criterion ${pair.targetCriterion} missing`).toBeDefined();
      expect(target?.status, target?.reason).toBe('fail');
    });

    it(`passes the GOOD ${pair.name} with no false alarm`, async () => {
      const v = await verify(actionEffect, pair.good);
      const fails = v.results.filter((r) => r.status === 'fail');
      expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
      expect(v.acceptanceScore).toBe(1);
    });
  }

  it('emits the first accuracy number', async () => {
    const total = pairs.length;
    let detected = 0;
    let falseAlarms = 0;
    for (const pair of pairs) {
      const bad = await verify(actionEffect, pair.bad);
      const good = await verify(actionEffect, pair.good);
      if (bad.results.find((r) => r.criterionId === pair.targetCriterion)?.status === 'fail') detected++;
      if (good.results.some((r) => r.status === 'fail')) falseAlarms++;
    }
    // eslint-disable-next-line no-console
    console.log(`\n[AVP] detection=${detected}/${total}  false-alarm=${falseAlarms}/${total}\n`);
    expect(detected).toBe(total);
    expect(falseAlarms).toBe(0);
  });
});
