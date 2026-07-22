import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { temporalIntegrity } from '../src/archetypes/temporal-integrity';
import type { ReactTemporalSubject } from '../src/adapter-react/temporal-integrity';
import { buildFloatingScreen, DATE_ONLY, type FloatingVariant } from './dataset/floating-date';

/**
 * temporal-integrity · floating-date-not-shifted — the sharp opposite of
 * zoned-to-user: a date-only value (an expiry date, a birthday) has NO timezone and
 * must display as authored, never zone-shifted by a `new Date()` / `dayjs.tz()`
 * round-trip. Conflating "apply the viewer's zone" (for instants) with "apply NO
 * zone" (for floating dates) is the #1 source of date confusion in JS. Faithful
 * escape: cal.com `dayjs.tz(dateStr, tz)` → `dayjs.utc(dateStr)` (26e85823).
 * Deterministic on any CI host: `2025-01-01` localized to any zone behind UTC drops
 * to 2024-12-31.
 */
const subject = (variant: FloatingVariant): ReactTemporalSubject => ({
  name: `floating-${variant}`,
  render: buildFloatingScreen(variant),
  dateOnly: DATE_ONLY,
});

const floatingStatus = async (variant: FloatingVariant) => {
  const v = await verify(temporalIntegrity, subject(variant));
  return v.results.find((r) => r.criterionId === 'floating-date-not-shifted');
};

describe('AVP — verifier accuracy (temporal-integrity · floating-date-not-shifted)', () => {
  it('fails the BAD readout on "floating-date-not-shifted" (zone-shifted date-only — escape calcom:26e85823)', async () => {
    const target = await floatingStatus('dayjs-tz');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD readout with no false alarm (instant criterion is not applicable)', async () => {
    const v = await verify(temporalIntegrity, subject('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
    expect(v.results.find((r) => r.criterionId === 'zoned-to-user')?.status).toBe('not-applicable');
  });

  it('emits the floating-date-not-shifted number', async () => {
    const detected = (await floatingStatus('dayjs-tz'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await floatingStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP] temporal-integrity floating-date-not-shifted detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for floating-date-not-shifted — distinct mechanisms that strand a
 * date-only value in a zone: `dayjs.tz`-style Intl localization, `toLocaleDateString`
 * with a zone, a far-western zone, and manual offset subtraction. Every one drops the
 * date a day; a robust criterion kills all of them while leaving the as-authored GOOD
 * readout green.
 */
const MUTANTS: readonly FloatingVariant[] = ['dayjs-tz', 'tolocale', 'honolulu', 'offset-sub'];

describe('AVP — mutation testing (temporal-integrity · floating-date-not-shifted)', () => {
  it('kills every zone-shift mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await floatingStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await floatingStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP mutation] temporal-integrity · floating-date-not-shifted: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the as-authored readout').toBe(false);
  });
});
