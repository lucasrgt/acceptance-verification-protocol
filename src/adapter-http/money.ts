import { AvpFail, type Probe } from '../core/dsl';
import type { MoneyExpect } from '../archetypes/money-integrity';
import type { VerifyHooks } from '../core/run';
import type { HttpMoneySubject, HttpRequestSpec } from './subject';

async function fetchJson(r: HttpRequestSpec): Promise<unknown> {
  const res = await fetch(r.url, {
    method: r.method,
    headers: { 'content-type': 'application/json', ...(r.headers ?? {}) },
    body: r.body !== undefined ? JSON.stringify(r.body) : undefined,
  });
  return res.json().catch(() => ({}));
}

interface Leak {
  readonly total: number;
  readonly platformCents: number;
  readonly hostCents: number;
  readonly why: string;
}

/**
 * The HTTP adapter's `money-integrity` probe. Fires the split endpoint over the
 * subject's range of totals and records the FIRST total whose split violates an
 * invariant: it must sum to the whole exactly, both shares non-negative, and the
 * platform share within a cent of the policy fraction (remainder may fall either
 * side). A float-percentage split (`round(t*0.15)+round(t*0.85)`) leaks a cent and
 * is caught here.
 */
export function moneyProbe(subject: HttpMoneySubject): Probe<MoneyExpect> {
  let leak: Leak | null = null;
  let probed = 0;

  return {
    async act() {
      for (const total of subject.totals) {
        const { platformCents, hostCents } = subject.readShares(await fetchJson(subject.splitRequest(total)));
        probed++;
        const lo = Math.floor((total * subject.platformBps) / 10000);
        const hi = Math.ceil((total * subject.platformBps) / 10000);
        let why: string | null = null;
        if (platformCents + hostCents !== total) {
          why = `platform (${platformCents}) + host (${hostCents}) = ${platformCents + hostCents}, not ${total} — a cent leaked.`;
        } else if (platformCents < 0 || hostCents < 0) {
          why = `a share is negative (platform ${platformCents}, host ${hostCents}).`;
        } else if (platformCents < lo || platformCents > hi) {
          why = `platform share ${platformCents} is not the ${subject.platformBps / 100}% policy fraction (expected ${lo}–${hi}).`;
        }
        if (why) {
          leak = { total, platformCents, hostCents, why };
          break;
        }
      }
    },
    expect: {
      splitInvariant() {
        if (probed === 0) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (leak) {
          throw new AvpFail(
            `The money split is wrong at totalCents=${leak.total}: ${leak.why} Compute one share with integer basis-point math and assign the remainder to the other — never round each share independently with float percentages.`,
            leak,
          );
        }
      },
    },
  };
}

export function moneyHooks(subject: HttpMoneySubject): VerifyHooks {
  return { probe: () => moneyProbe(subject) };
}
