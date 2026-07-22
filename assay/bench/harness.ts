import { describe, it, expect } from 'vitest';
import type { Verdict } from '../src/core/types';

/**
 * The SHARED skeleton every accuracy bench repeats: for each labeled (good, bad) pair the
 * verifier must FAIL the bad on its target criterion and PASS the good with zero false
 * alarms, and the file emits one detection/false-alarm number. Each subject is verified
 * exactly ONCE (memoized) — the number is derived from the same verdicts the per-pair
 * assertions used, never re-run.
 *
 * New benches should build on this; existing ones migrate opportunistically when touched.
 */
export interface AccuracyPair<S> {
  readonly name: string;
  /** The criterion that must catch the bad variant. */
  readonly targetCriterion: string;
  /** The source-project commit the pattern was mined from. */
  readonly source: string;
  readonly good: S;
  readonly bad: S;
}

export function pairAccuracy<S>(opts: {
  readonly label: string;
  readonly pairs: ReadonlyArray<AccuracyPair<S>>;
  /** Adapter-agnostic runner: verify the subject and return the Verdict. */
  readonly run: (subject: S) => Promise<Verdict>;
}): void {
  const memo = new Map<string, Promise<Verdict>>();
  const verdictOf = (pair: AccuracyPair<S>, kind: 'good' | 'bad'): Promise<Verdict> => {
    const key = `${pair.name}:${kind}`;
    if (!memo.has(key)) memo.set(key, opts.run(kind === 'bad' ? pair.bad : pair.good));
    return memo.get(key)!;
  };

  describe(`AVP — verifier accuracy (${opts.label})`, () => {
    for (const pair of opts.pairs) {
      it(`fails the BAD ${pair.name} on "${pair.targetCriterion}" (escape ${pair.source})`, async () => {
        const v = await verdictOf(pair, 'bad');
        const target = v.results.find((r) => r.criterionId === pair.targetCriterion);
        expect(target, `criterion ${pair.targetCriterion} missing`).toBeDefined();
        expect(target?.status, target?.reason).toBe('fail');
      });

      it(`passes the GOOD ${pair.name} with no false alarm`, async () => {
        const v = await verdictOf(pair, 'good');
        const fails = v.results.filter((r) => r.status === 'fail');
        expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
        expect(v.acceptanceScore).toBe(1);
      });
    }

    it(`emits the ${opts.label} accuracy number`, async () => {
      let detected = 0;
      let falseAlarms = 0;
      for (const pair of opts.pairs) {
        const bad = await verdictOf(pair, 'bad');
        const good = await verdictOf(pair, 'good');
        if (bad.results.find((r) => r.criterionId === pair.targetCriterion)?.status === 'fail') detected++;
        if (good.results.some((r) => r.status === 'fail')) falseAlarms++;
      }
       
      console.log(`\n[AVP] ${opts.label} detection=${detected}/${opts.pairs.length}  false-alarm=${falseAlarms}/${opts.pairs.length}\n`);
      expect(detected).toBe(opts.pairs.length);
      expect(falseAlarms).toBe(0);
    });
  });
}
