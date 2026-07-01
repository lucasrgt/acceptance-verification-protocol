import { AvpFail, type Probe } from '../core/dsl';
import type { SecondOrderExpect } from '../archetypes/second-order-effects';
import type { VerifyHooks } from '../core/run';
import type { HttpNotifySubject } from './subject';
import { ok, sendJson } from './wire';

const inboxCount = async (url: string): Promise<number> => {
  const reply = await sendJson({ method: 'GET', url });
  return Array.isArray(reply.body) ? reply.body.length : 0;
};

/**
 * The HTTP adapter's `second-order-effects` probe (notify all parties). Counts each
 * inbox BEFORE and AFTER the trigger — pre-existing notifications from earlier runs
 * never fake a pass — and requires the trigger itself to succeed, so a 500 on the
 * transition is reported as what it is, not as "did not notify".
 */
export function notifyProbe(subject: HttpNotifySubject): Probe<SecondOrderExpect> {
  const delta: Record<string, number> = {};
  let triggerStatus: number | null = null;

  return {
    async act() {
      const before: Record<string, number> = {};
      for (const ib of subject.inboxes) before[ib.party] = await inboxCount(ib.url);

      triggerStatus = (await sendJson(subject.trigger)).status;

      for (const ib of subject.inboxes) {
        delta[ib.party] = (await inboxCount(ib.url)) - (before[ib.party] ?? 0);
      }
    },
    expect: {
      notifiesAllParties() {
        if (triggerStatus === null) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (!ok(triggerStatus)) {
          throw new AvpFail(
            `The state transition itself failed (${triggerStatus}) — the notification fan-out could not be observed. Fix the trigger first.`,
            { triggerStatus },
          );
        }
        const missed = subject.inboxes.filter((ib) => (delta[ib.party] ?? 0) <= 0).map((ib) => ib.party);
        if (missed.length > 0) {
          throw new AvpFail(
            `A state transition did not notify every party it concerns: ${missed.join(', ')} received no NEW notification. Fan out to all parties on the transition, not just one.`,
            { delta },
          );
        }
      },
    },
  };
}

export function notifyHooks(subject: HttpNotifySubject): VerifyHooks {
  return { probe: () => notifyProbe(subject) };
}
