import { AvpFail, type Probe } from '../core/dsl';
import type { SecondOrderExpect } from '../archetypes/second-order-effects';
import type { VerifyHooks } from '../core/run';
import type { HttpNotifySubject } from './subject';

/** The HTTP adapter's `second-order-effects` probe (notify all parties). */
export function notifyProbe(subject: HttpNotifySubject): Probe<SecondOrderExpect> {
  const counts: Record<string, number> = {};
  let acted = false;

  return {
    async act() {
      const t = subject.trigger;
      await fetch(t.url, {
        method: t.method,
        headers: { 'content-type': 'application/json', ...(t.headers ?? {}) },
        body: t.body !== undefined ? JSON.stringify(t.body) : undefined,
      });
      for (const ib of subject.inboxes) {
        const res = await fetch(ib.url);
        const arr = (await res.json().catch(() => [])) as unknown;
        counts[ib.party] = Array.isArray(arr) ? arr.length : 0;
      }
      acted = true;
    },
    expect: {
      notifiesAllParties() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        const missed = subject.inboxes.filter((ib) => (counts[ib.party] ?? 0) === 0).map((ib) => ib.party);
        if (missed.length > 0) {
          throw new AvpFail(
            `A state transition did not notify every party it concerns: ${missed.join(', ')} received no notification. Fan out to all parties on the transition, not just one.`,
            { counts },
          );
        }
      },
    },
  };
}

export function notifyHooks(subject: HttpNotifySubject): VerifyHooks {
  return { probe: () => notifyProbe(subject) };
}
