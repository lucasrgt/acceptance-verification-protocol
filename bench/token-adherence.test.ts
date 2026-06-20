import { describe, it, expect } from 'vitest';
import { verifyDesign } from '../src/adapter-design/verify';
import { tokenAdherence } from '../src/archetypes/token-adherence';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildTokenCard, type TokenVariant } from './dataset/token-card';

/**
 * THE DESIGN SPIKE — token-adherence · uses-tokens-only. The first design-fidelity
 * criterion, proving the AVP protocol extends to design: same core/run.ts, a new
 * archetype, a new (jsdom computed-style) substrate, verified against the design
 * system as ground truth (src/design/tokens.ts). Faithful escape: "badge tones go
 * semantic — the raw palette steps had no dark pair" (dd834c98).
 */
const subject = (variant: TokenVariant): ReactDesignSubject => ({
  name: `token-${variant}`,
  render: buildTokenCard(variant),
});

const tokenStatus = async (variant: TokenVariant) => {
  const v = await verifyDesign(tokenAdherence, subject(variant));
  return v.results.find((r) => r.criterionId === 'uses-tokens-only');
};

describe('AVP Design — verifier accuracy (token-adherence · uses-tokens-only)', () => {
  it('fails the BAD surface on "uses-tokens-only" (raw palette step — escape dd834c98)', async () => {
    const target = await tokenStatus('raw-hex-color');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD surface with no false alarm (every value on the token scale)', async () => {
    const v = await verifyDesign(tokenAdherence, subject('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the token-adherence number', async () => {
    const detected = (await tokenStatus('raw-hex-color'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await tokenStatus('good'))?.status === 'fail' ? 1 : 0;
    // eslint-disable-next-line no-console
    console.log(`\n[AVP Design] token-adherence uses-tokens-only detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for uses-tokens-only — distinct off-scale categories: a raw palette
 * colour, an off-scale background, off-scale spacing, off-scale radius, off-scale font.
 * A robust criterion kills every one while leaving the all-token GOOD surface green.
 */
const MUTANTS: readonly TokenVariant[] = ['raw-hex-color', 'off-scale-bg', 'off-scale-space', 'off-scale-radius', 'off-scale-font'];

describe('AVP Design — mutation testing (token-adherence · uses-tokens-only)', () => {
  it('kills every off-scale mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await tokenStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await tokenStatus('good'))?.status === 'fail';
    // eslint-disable-next-line no-console
    console.log(
      `\n[AVP Design mutation] token-adherence · uses-tokens-only: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the all-token surface').toBe(false);
  });
});
