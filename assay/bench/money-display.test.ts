import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { moneyIntegrity } from '../src/archetypes/money-integrity';
import type { ReactMoneySubject } from '../src/adapter-react/money-integrity';
import { buildAmount, AMOUNT_MINOR, type MoneyVariant } from './dataset/money-amount';

/**
 * money-integrity · amount-rendered-exact — the DISPLAY half of money-integrity (its
 * money-at-rest half, split-invariant, runs over HTTP). A money amount must be shown
 * at the currency's exact precision — no float artifact, no dropped/extra decimals, no
 * wrong rounding. This makes money-integrity the second archetype executed across BOTH
 * substrates (HTTP + React). Mined from firefly-iii (89 money fixes): "Foreign Amount
 * rounded on some pages" (797064a1), "reconciliation displayed amount" (d55cc03e).
 */
const subject = (variant: MoneyVariant): ReactMoneySubject => ({
  name: `money-${variant}`,
  render: buildAmount(variant),
  amountMinor: AMOUNT_MINOR,
  precision: 2,
  amountTestId: 'amount',
});

const amountStatus = async (variant: MoneyVariant) => {
  const v = await verify(moneyIntegrity, subject(variant));
  return v.results.find((r) => r.criterionId === 'amount-rendered-exact');
};

describe('AVP — verifier accuracy (money-integrity · amount-rendered-exact)', () => {
  it('fails the BAD amount on "amount-rendered-exact" (dropped trailing zero — escape firefly:ebc7ea0e)', async () => {
    const target = await amountStatus('no-fixed');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD amount with no false alarm (split criterion is not applicable on the React adapter)', async () => {
    const v = await verify(moneyIntegrity, subject('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
    expect(v.results.find((r) => r.criterionId === 'split-invariant')?.status).toBe('not-applicable');
  });

  it('emits the amount-rendered-exact number', async () => {
    const detected = (await amountStatus('no-fixed'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await amountStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP] money-integrity amount-rendered-exact detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for amount-rendered-exact — distinct float-display defects on the
 * same exact value (1050 minor units = 10.50): a dropped trailing zero, dropped minor
 * units, phantom over-precision, and rounding the cents away. A robust criterion kills
 * every one while leaving the exactly-formatted GOOD amount green.
 */
const MUTANTS: readonly MoneyVariant[] = ['no-fixed', 'drops-cents', 'over-precision', 'wrong-round'];

describe('AVP — mutation testing (money-integrity · amount-rendered-exact)', () => {
  it('kills every money-display mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await amountStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await amountStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP mutation] money-integrity · amount-rendered-exact: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the exactly-formatted amount').toBe(false);
  });
});
