import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { verifyHttp } from '../src/adapter-http/verify';
import { moneyIntegrity } from '../src/archetypes/money-integrity';
import type { HttpMoneySubject } from '../src/adapter-http/subject';
import { startMoneyServer, PLATFORM_BPS, type MoneyVariant } from './dataset/money-server';

/**
 * money-integrity · split-invariant — the FIRST executed money criterion, verified
 * over real HTTP. A 15/85 platform/host split must sum to the whole, exact to the
 * cent, for every total. The faithful escape is independent float-percentage
 * rounding (round(t*0.15)+round(t*0.85)), which leaks a cent (t=10 → 2+9 = 11). The
 * GOOD server uses integer basis-point math with a deterministic remainder. The
 * money class is confirmed cross-stack in .NET (bitwarden currency-culture fixes).
 */
const servers: Partial<Record<MoneyVariant, Awaited<ReturnType<typeof startMoneyServer>>>> = {};
const VARIANTS: readonly MoneyVariant[] = [
  'good',
  'round-both',
  'floor-both',
  'ceil-both',
  'float-truncate',
  'misproportion',
];

beforeAll(async () => {
  for (const v of VARIANTS) servers[v] = await startMoneyServer(v);
});
afterAll(async () => {
  await Promise.all(VARIANTS.map((v) => servers[v]?.close()));
});

// Leak-prone (10, 13, 33, 99…) and exact (100, 10000) totals, plus large amounts.
const TOTALS = [1, 3, 7, 10, 13, 33, 99, 100, 101, 199, 1000, 1234, 9999, 10000, 12345] as const;

const splitSubject = (baseUrl: string): HttpMoneySubject => ({
  name: 'booking-split',
  splitRequest: (totalCents) => ({ method: 'POST', url: `${baseUrl}/split`, body: { totalCents } }),
  readShares: (body) => body as { platformCents: number; hostCents: number },
  platformBps: PLATFORM_BPS,
  totals: TOTALS,
});

const splitStatus = async (variant: MoneyVariant) => {
  const v = await verifyHttp(moneyIntegrity, splitSubject(servers[variant]!.baseUrl));
  return v.results.find((r) => r.criterionId === 'split-invariant');
};

describe('AVP — verifier accuracy (money-integrity, HTTP adapter)', () => {
  it('fails the BAD backend on "split-invariant" (float-rounding cent leak)', async () => {
    const target = await splitStatus('round-both');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD backend with no false alarm', async () => {
    const v = await verifyHttp(moneyIntegrity, splitSubject(servers.good!.baseUrl));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('sanity: the GOOD split actually sums to the whole and is the right fraction', async () => {
    const res = await fetch(`${servers.good!.baseUrl}/split`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ totalCents: 10000 }),
    });
    const { platformCents, hostCents } = (await res.json()) as { platformCents: number; hostCents: number };
    expect(platformCents + hostCents).toBe(10000);
    expect(platformCents).toBe(1500); // 15% of 10000, exact
  });

  it('emits the money-integrity (HTTP) number', async () => {
    const detected = (await splitStatus('round-both'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await splitStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP] money-integrity (HTTP adapter) detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for split-invariant — distinct ways the split can fail (each a
 * real rounding bug). A robust criterion KILLS every one (fails it) while leaving
 * the healthy GOOD server green. A survivor is a hole in the verifier.
 */
const MUTANTS: readonly MoneyVariant[] = ['round-both', 'floor-both', 'ceil-both', 'float-truncate', 'misproportion'];

describe('AVP — mutation testing (money-integrity · split-invariant)', () => {
  it('kills every rounding mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await splitStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await splitStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP mutation] money-integrity · split-invariant: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the healthy split').toBe(false);
  });
});
