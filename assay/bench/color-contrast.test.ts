import { describe, it, expect } from 'vitest';
import { verifyDesign } from '../src/adapter-design/verify';
import { colorContrast } from '../src/archetypes/color-contrast';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildContrastCard, type ContrastVariant } from './dataset/contrast-card';

/**
 * AVP Design — color-contrast · contrast-sufficient. The sixth design criterion (last
 * of the jsdom tier): every text/background pair meets WCAG AA. Distinct from
 * theme-parity/token-adherence — a pair can be perfectly on-scale and still fail
 * contrast (muted text on white). Faithful: "light badges in dark mode" (dd834c98).
 * Deterministic: compute the WCAG ratio directly (src/design/contrast.ts).
 */
const subject = (variant: ContrastVariant): ReactDesignSubject => ({
  name: `contrast-${variant}`,
  render: buildContrastCard(variant),
});

const contrastStatus = async (variant: ContrastVariant) => {
  const v = await verifyDesign(colorContrast, subject(variant));
  return v.results.find((r) => r.criterionId === 'contrast-sufficient');
};

describe('AVP Design — verifier accuracy (color-contrast · contrast-sufficient)', () => {
  it('fails the BAD card on "contrast-sufficient" (muted text on white — escape dd834c98)', async () => {
    const target = await contrastStatus('low-muted');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD card with no false alarm (legible pairing)', async () => {
    const v = await verifyDesign(colorContrast, subject('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the color-contrast number', async () => {
    const detected = (await contrastStatus('low-muted'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await contrastStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP Design] color-contrast contrast-sufficient detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for contrast-sufficient — distinct too-low pairings: muted grey on
 * white, light grey on white, dark text on a dark surface (invisible), a light danger
 * red on white. A robust criterion kills every one while leaving the legible GOOD card
 * green.
 */
const MUTANTS: readonly ContrastVariant[] = ['low-muted', 'light-on-light', 'dark-on-dark', 'danger-low'];

describe('AVP Design — mutation testing (color-contrast · contrast-sufficient)', () => {
  it('kills every low-contrast mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await contrastStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await contrastStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP Design mutation] color-contrast · contrast-sufficient: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the legible card').toBe(false);
  });
});
