import { describe, it, expect } from 'vitest';
import { verifyDesign } from '../src/adapter-design/verify';
import { spacingRhythm } from '../src/archetypes/spacing-rhythm';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildNestedCard, type SpacingVariant } from './dataset/nested-card';

/**
 * AVP Design — spacing-rhythm · rhythm-holds. The seventh design criterion (the user's
 * 4×/2×/1× nested padding example): nested containers' padding is on the spacing scale,
 * decreases with depth (outer roomier than inner), and is consistent at a depth.
 * Checks DECLARED padding (inline → jsdom-readable), no layout engine. Faithful:
 * "uniform page padding at every breakpoint" (b885222b), "one padding" (25b16a79).
 */
const subject = (variant: SpacingVariant): ReactDesignSubject => ({
  name: `spacing-${variant}`,
  render: buildNestedCard(variant),
});

const spacingStatus = async (variant: SpacingVariant) => {
  const v = await verifyDesign(spacingRhythm, subject(variant));
  return v.results.find((r) => r.criterionId === 'rhythm-holds');
};

describe('AVP Design — verifier accuracy (spacing-rhythm · rhythm-holds)', () => {
  it('fails the BAD card on "rhythm-holds" (inner roomier than outer — escape b885222b)', async () => {
    const target = await spacingStatus('inverted');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD card with no false alarm (24 > 16 > 8, on scale)', async () => {
    const v = await verifyDesign(spacingRhythm, subject('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the spacing-rhythm number', async () => {
    const detected = (await spacingStatus('inverted'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await spacingStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP Design] spacing-rhythm rhythm-holds detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for rhythm-holds — distinct ways the nesting rhythm breaks: inverted
 * (inner roomier), an off-scale pad, flat (no rhythm), and two same-depth containers at
 * different padding. A robust criterion kills every one while leaving the 24>16>8 GOOD
 * card green.
 */
const MUTANTS: readonly SpacingVariant[] = ['inverted', 'off-scale', 'flat', 'inconsistent'];

describe('AVP Design — mutation testing (spacing-rhythm · rhythm-holds)', () => {
  it('kills every broken-rhythm mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await spacingStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await spacingStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP Design mutation] spacing-rhythm · rhythm-holds: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the rhythmic card').toBe(false);
  });
});
