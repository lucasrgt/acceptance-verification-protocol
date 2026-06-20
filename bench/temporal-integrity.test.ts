import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { temporalIntegrity } from '../src/archetypes/temporal-integrity';
import type { ReactTemporalSubject } from '../src/adapter-react/temporal-integrity';
import { buildTemporalScreen, INSTANT_ISO, USER_ZONE, type TemporalVariant } from './dataset/temporal-readout';

/**
 * temporal-integrity · zoned-to-user — the first executed criterion of a genuinely
 * NEW archetype, mined from two fresh domains (e-signature: documenso; scheduling:
 * cal.com, where timezone is the product and 189 fix commits are timezone-shaped).
 * A stored UTC instant must be displayed in the VIEWER's timezone; near a day
 * boundary, a UTC/server/ambient rendering is off by a day and the test — pinned to
 * one instant in one zone — never sees it. Faithful, deterministic on any CI host:
 * `2025-01-01T02:00Z` is 2024-12-31 in America/Sao_Paulo but 2025-01-01 in UTC.
 */
const subject = (variant: TemporalVariant): ReactTemporalSubject => ({
  name: `temporal-${variant}`,
  render: buildTemporalScreen(variant),
  instantIso: INSTANT_ISO,
  timeZone: USER_ZONE,
});

const zonedStatus = async (variant: TemporalVariant) => {
  const v = await verify(temporalIntegrity, subject(variant));
  return v.results.find((r) => r.criterionId === 'zoned-to-user');
};

describe('AVP — verifier accuracy (temporal-integrity · zoned-to-user)', () => {
  it('fails the BAD readout on "zoned-to-user" (UTC day-boundary off-by-one — escape calcom:c1d0a6bb)', async () => {
    const target = await zonedStatus('utc');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD readout with no false alarm (date shown in the user\'s zone)', async () => {
    const v = await verify(temporalIntegrity, subject('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the zoned-to-user number', async () => {
    const detected = (await zonedStatus('utc'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await zonedStatus('good'))?.status === 'fail' ? 1 : 0;
    // eslint-disable-next-line no-console
    console.log(`\n[AVP] temporal-integrity zoned-to-user detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for zoned-to-user — distinct ways an instant gets shown in the
 * wrong zone: formatted in UTC, the lazy `toISOString().slice(0,10)`, a far-east
 * server zone (Tokyo), a fixed server zone (London), and dumping the raw UTC ISO.
 * Every one renders the day AHEAD of the user's; a robust criterion kills all of
 * them while leaving the user-zoned GOOD readout green.
 */
const MUTANTS: readonly TemporalVariant[] = ['utc', 'iso-slice', 'tokyo', 'server-london', 'raw-iso'];

describe('AVP — mutation testing (temporal-integrity · zoned-to-user)', () => {
  it('kills every wrong-zone mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await zonedStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await zonedStatus('good'))?.status === 'fail';
    // eslint-disable-next-line no-console
    console.log(
      `\n[AVP mutation] temporal-integrity · zoned-to-user: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the user-zoned readout').toBe(false);
  });
});
