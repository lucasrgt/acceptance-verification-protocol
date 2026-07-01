import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { renderResilience } from '../src/archetypes/render-resilience';
import type { ReactResilienceSubject } from '../src/adapter-react/render-resilience';
import { buildProfileCard, type ResilienceVariant } from './dataset/profile-card';

/**
 * render-resilience · survives-malformed-data — a surface fed the data it can actually
 * receive (null user, missing array, non-string field, absent nested object) must
 * degrade, not white-screen. AVP's thesis in its purest form: the unit test ran on
 * the happy fixture and passed; only rendering the real edge data finds the crash.
 * Faithful escapes: cal.com "a.trim is not a function" (000324c0); documenso "prevent
 * crash when removing last dropdown option" (43fe5584).
 */
const subject = (variant: ResilienceVariant): ReactResilienceSubject => ({
  name: `resilience-${variant}`,
  render: buildProfileCard(variant),
  fallbackMarker: /No profile data/i,
});

const resilienceStatus = async (variant: ResilienceVariant) => {
  const v = await verify(renderResilience, subject(variant));
  return v.results.find((r) => r.criterionId === 'survives-malformed-data');
};

describe('AVP — verifier accuracy (render-resilience · survives-malformed-data)', () => {
  it('fails the BAD surface on "survives-malformed-data" (crash on null field — escape calcom:000324c0)', async () => {
    const target = await resilienceStatus('null-user');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD surface with no false alarm (degrades to a fallback, no crash)', async () => {
    const v = await verify(renderResilience, subject('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the survives-malformed-data number', async () => {
    const detected = (await resilienceStatus('null-user'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await resilienceStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP] render-resilience survives-malformed-data detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for survives-malformed-data — distinct unguarded accesses that
 * crash on the same degenerate payload: a null nested object, an undefined array, a
 * non-string field, an absent nested object. A robust criterion kills every crash
 * while leaving the guarded GOOD surface green.
 */
const MUTANTS: readonly ResilienceVariant[] = ['null-user', 'undef-items', 'nonstring-title', 'missing-meta'];

describe('AVP — mutation testing (render-resilience · survives-malformed-data)', () => {
  it('kills every crash-on-edge-data mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await resilienceStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await resilienceStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP mutation] render-resilience · survives-malformed-data: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the guarded surface').toBe(false);
  });
});
