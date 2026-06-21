import { describe, it, expect } from 'vitest';
import { verifyDesign } from '../src/adapter-design/verify';
import { inputPurpose } from '../src/archetypes/input-purpose';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildSignupForm, type SignupVariant } from './dataset/signup-form';

/**
 * AVP Design — input-purpose · personal-fields-declare-purpose (WCAG 1.3.5). A `dom`-substrate
 * a11y criterion: every input collecting a known kind of personal data declares an autocomplete
 * token, while an opaque field (a search box) gets no opinion. Scoped tight so false-alarm stays
 * 0. Faithfully grounded in cal.com's autocomplete cluster (#24422, #21065, #6705, #2645).
 * Deterministic in jsdom: render, find the unambiguous personal fields, check each has autocomplete.
 */
const subject = (variant: SignupVariant): ReactDesignSubject => ({
  name: `input-purpose-${variant}`,
  render: buildSignupForm(variant),
});

const purposeStatus = async (variant: SignupVariant) => {
  const v = await verifyDesign(inputPurpose, subject(variant));
  return v.results.find((r) => r.criterionId === 'personal-fields-declare-purpose');
};

describe('AVP Design — verifier accuracy (input-purpose · personal-fields-declare-purpose)', () => {
  it('fails the BAD form on "personal-fields-declare-purpose" (email field with no autocomplete — escape #21065)', async () => {
    const target = await purposeStatus('email-missing');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD form with no false alarm (every personal field declares autocomplete; search ignored)', async () => {
    const v = await verifyDesign(inputPurpose, subject('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the input-purpose number', async () => {
    const detected = (await purposeStatus('email-missing'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await purposeStatus('good'))?.status === 'fail' ? 1 : 0;
    // eslint-disable-next-line no-console
    console.log(`\n[AVP Design] input-purpose personal-fields-declare-purpose detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for personal-fields-declare-purpose — each distinct personal field losing
 * its autocomplete token: email, password, phone, name. A robust criterion kills every one
 * while leaving the GOOD form green — and crucially never flags the non-personal search box.
 */
const MUTANTS: readonly SignupVariant[] = ['email-missing', 'password-missing', 'phone-missing', 'name-missing'];

describe('AVP Design — mutation testing (input-purpose · personal-fields-declare-purpose)', () => {
  it('kills every missing-autocomplete mutant + no false alarm on the search box', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await purposeStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await purposeStatus('good'))?.status === 'fail';
    // eslint-disable-next-line no-console
    console.log(
      `\n[AVP Design mutation] input-purpose · personal-fields-declare-purpose: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the form with a non-personal search box').toBe(false);
  });
});
