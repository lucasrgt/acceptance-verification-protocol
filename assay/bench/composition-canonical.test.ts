import { describe, it, expect } from 'vitest';
import { verifyDesign } from '../src/adapter-design/verify';
import { compositionCanonical } from '../src/archetypes/composition-canonical';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildHeader, COMPOSITION, type HeaderVariant } from './dataset/page-header';

/**
 * AVP Design — composition-canonical · canonical-composition. The fourth design
 * criterion (atoms/molecules/organisms): the screen header's slots are the canonical
 * DS components, present and in order — back · icon · title. The escape is a bespoke
 * fork, a missing slot, or the back affordance below the title. Faithful: "consolidate
 * … into one <TabBar>" (897c6aa0), "ícone da tela no page header" (c596531b).
 */
const subject = (variant: HeaderVariant): ReactDesignSubject => ({
  name: `header-${variant}`,
  render: buildHeader(variant),
  composition: COMPOSITION,
});

const compStatus = async (variant: HeaderVariant) => {
  const v = await verifyDesign(compositionCanonical, subject(variant));
  return v.results.find((r) => r.criterionId === 'canonical-composition');
};

describe('AVP Design — verifier accuracy (composition-canonical · canonical-composition)', () => {
  it('fails the BAD header on "canonical-composition" (back below the title — escape c596531b)', async () => {
    const target = await compStatus('wrong-order');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD header with no false alarm (canonical slots, in order)', async () => {
    const v = await verifyDesign(compositionCanonical, subject('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the composition-canonical number', async () => {
    const detected = (await compStatus('wrong-order'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await compStatus('good'))?.status === 'fail' ? 1 : 0;
    // eslint-disable-next-line no-console
    console.log(`\n[AVP Design] composition-canonical canonical-composition detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for canonical-composition — distinct ways the composition breaks: the
 * back affordance below the title (wrong order), a missing screen icon, a hand-rolled
 * back (a fork, no DS marker), and no back affordance. A robust criterion kills every
 * one while leaving the canonical GOOD header green.
 */
const MUTANTS: readonly HeaderVariant[] = ['wrong-order', 'missing-icon', 'bespoke-back', 'missing-back'];

describe('AVP Design — mutation testing (composition-canonical · canonical-composition)', () => {
  it('kills every broken-composition mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await compStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await compStatus('good'))?.status === 'fail';
    // eslint-disable-next-line no-console
    console.log(
      `\n[AVP Design mutation] composition-canonical · canonical-composition: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the canonical header').toBe(false);
  });
});
