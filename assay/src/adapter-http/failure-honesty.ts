import { AvpFail, type Probe } from '../core/dsl';
import type { FailureHonestyExpect } from '../archetypes/failure-honesty';
import type { VerifyHooks } from '../core/run';
import type { HttpFailureHonestySubject } from './subject';
import { sendJson } from './wire';

/** Observes whether an operation tells the truth when its required dependency fails. */
export function failureHonestyProbe(subject: HttpFailureHonestySubject): Probe<FailureHonestyExpect> {
  let status: number | null = null;
  let body: unknown;
  return {
    async act() {
      const response = await sendJson(subject.request);
      status = response.status;
      body = response.body;
    },
    expect: {
      dependencyFailureAdmitted() {
        if (status === null) throw new AvpFail('probe used before the faulting request ran.');
        const admitted = subject.admitsFailure ? subject.admitsFailure(status, body) : status < 200 || status >= 300;
        if (!admitted) {
          throw new AvpFail(
            `A required dependency failed but the operation returned ${status} without its declared error envelope — phantom success.`,
            { status, body },
          );
        }
      },
    },
  };
}

/** HTTP binding for the failure-honesty archetype. */
export function failureHonestyHooks(subject: HttpFailureHonestySubject): VerifyHooks {
  return { probe: () => failureHonestyProbe(subject) };
}
