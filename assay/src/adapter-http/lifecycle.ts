import { AvpFail, type Probe } from '../core/dsl';
import type { LifecycleGateExpect } from '../archetypes/lifecycle-gate';
import type { VerifyHooks } from '../core/run';
import type { HttpLifecycleSubject } from './subject';
import { ok, refused, sendStatus } from './wire';

/**
 * The HTTP adapter's `lifecycle-gate` probe. Fires the transition on a resource
 * whose precondition is unmet (must be refused) and, if declared, on a ready
 * resource (must succeed). A 2xx on the unmet transition is the escape: the gate was
 * only client-side.
 */
export function lifecycleProbe(subject: HttpLifecycleSubject): Probe<LifecycleGateExpect> {
  let unmet: number | null = null;
  let ready: number | null = null;

  return {
    async act() {
      unmet = await sendStatus(subject.transition);
      if (subject.whenReady) ready = await sendStatus(subject.whenReady);
    },
    expect: {
      gateEnforcedServerSide() {
        if (unmet === null) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (ok(unmet)) {
          throw new AvpFail(
            `A state transition succeeded (${unmet}) on a resource whose precondition is unmet — the gate is only client-side, bypassable by a direct request. Enforce the precondition server-side and refuse (${(subject.rejectWith ?? [409, 422, 403]).join('/')}).`,
            { unmet },
          );
        }
        if (!refused(unmet, subject.rejectWith)) {
          throw new AvpFail(
            `The unmet transition returned ${unmet} — a crash/unexpected status is not a gate. Refuse it deliberately (${(subject.rejectWith ?? [409, 422, 403]).join('/')}).`,
            { unmet },
          );
        }
        if (ready !== null && !ok(ready)) {
          throw new AvpFail(
            `The transition was refused (${ready}) even on a ready resource — the server rejects everything, not only unmet preconditions. Allow the transition when the precondition holds.`,
            { ready },
          );
        }
      },
      blockedActionIsDisabled() {
        throw new AvpFail('blockedActionIsDisabled is a DOM criterion; not observable over HTTP — use the React adapter.');
      },
    },
  };
}

export function lifecycleHooks(subject: HttpLifecycleSubject): VerifyHooks {
  return {
    probe: () => lifecycleProbe(subject),
    applies: (c) => (c.requires === 'blocked' ? 'HTTP subject — DOM-only criterion not applicable.' : null),
  };
}
