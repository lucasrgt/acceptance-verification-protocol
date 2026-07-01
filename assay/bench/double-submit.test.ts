import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { actionEffect } from '../src/archetypes/action-effect';
import type { ActionEffectSubject } from '../src/adapter-react/subject';
import { buildBookingButton, type DoubleSubmitVariant } from './dataset/double-submit';

/**
 * action-effect · single-flight — a fast double-activation must fire the effect once,
 * not twice. The no-failure sibling of idempotent-retry: a primary action that
 * doesn't guard itself in flight double-submits on a quick double-click. Faithful
 * escape: cal.com "disable button and handle submit when loading" (d7226fc3) /
 * "double bookings on seated event" (5b50a469); documenso "disable signing pad while
 * submitting" (56683aa9). The driver clicks twice in quick succession against a slow
 * endpoint and counts the requests.
 */
const subject = (variant: DoubleSubmitVariant): ActionEffectSubject => ({
  name: `double-submit-${variant}`,
  render: buildBookingButton(variant),
  endpoint: { method: 'POST', path: `${'http://localhost/api'}/book` },
  action: { role: 'button', name: /book/i },
  singleFlight: true,
});

const flightStatus = async (variant: DoubleSubmitVariant) => {
  const v = await verify(actionEffect, subject(variant));
  return v.results.find((r) => r.criterionId === 'single-flight');
};

describe('AVP — verifier accuracy (action-effect · single-flight)', () => {
  it('fails the BAD button on "single-flight" (double-submit — escape calcom:5b50a469)', async () => {
    const target = await flightStatus('unguarded');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD button with no false alarm (disabled while in flight)', async () => {
    const target = await flightStatus('good');
    expect(target?.status, target?.reason).toBe('pass');
  });

  it('emits the single-flight number', async () => {
    const detected = (await flightStatus('unguarded'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await flightStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP] action-effect single-flight detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for single-flight — distinct ways a guard fails to make a control
 * single-flight: no guard, an aria-disabled lie, a visual-only className, and a guard
 * set after the await. Every one double-fires; a robust criterion kills all of them
 * while leaving the truly-disabled GOOD button green.
 */
const MUTANTS: readonly DoubleSubmitVariant[] = ['unguarded', 'aria-only', 'class-only', 'late-guard'];

describe('AVP — mutation testing (action-effect · single-flight)', () => {
  it('kills every unguarded-double-submit mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await flightStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await flightStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP mutation] action-effect · single-flight: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the guarded button').toBe(false);
  });
});
