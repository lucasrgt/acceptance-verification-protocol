import { AvpFail, type Probe } from '../core/dsl';
import type { MutationAtomicityExpect } from '../archetypes/mutation-atomicity';
import type { VerifyHooks } from '../core/run';
import type { HttpMutationAtomicitySubject } from './subject';
import { deepEqual, ok, sendJson, sendStatus } from './wire';

/** Drives concurrent same-token writes and a fault bracketed by observable state reads. */
export function mutationAtomicityProbe(subject: HttpMutationAtomicitySubject): Probe<MutationAtomicityExpect> {
  let conflictStatuses: readonly number[] | null = null;
  let faultStatus: number | null = null;
  let beforeState: unknown;
  let afterState: unknown;
  return {
    async act() {
      if (subject.conflictingUpdates) {
        conflictStatuses = await Promise.all(subject.conflictingUpdates.map((request) => sendStatus(request)));
      }
      if (subject.faultingMutation && subject.state && subject.readState) {
        beforeState = subject.readState((await sendJson(subject.state)).body);
        faultStatus = await sendStatus(subject.faultingMutation);
        afterState = subject.readState((await sendJson(subject.state)).body);
      }
    },
    expect: {
      concurrentConflictSurfaces() {
        if (!conflictStatuses) throw new AvpFail('probe used without conflicting updates.');
        const winners = conflictStatuses.filter(ok).length;
        const conflicts = conflictStatuses.filter((status) => (subject.conflictWith ?? [409, 412]).includes(status)).length;
        if (winners !== 1 || conflicts !== 1) {
          throw new AvpFail(
            `Concurrent conflict did not surface: statuses=${conflictStatuses.join(', ')}; expected exactly one success and one explicit 409/412 conflict.`,
            { conflictStatuses },
          );
        }
      },
      multiWriteIsAtomic() {
        if (faultStatus === null) throw new AvpFail('probe used without a faulting mutation and state reader.');
        if (ok(faultStatus)) {
          throw new AvpFail(`The forced mid-mutation fault returned ${faultStatus}; the fault scenario was not reached.`);
        }
        if (!deepEqual(beforeState, afterState)) {
          throw new AvpFail('A failed multi-write mutation left partial observable state.', { beforeState, afterState });
        }
      },
    },
  };
}

/** Applicability and probe binding for mutation-atomicity on the HTTP substrate. */
export function mutationAtomicityHooks(subject: HttpMutationAtomicitySubject): VerifyHooks {
  return {
    probe: () => mutationAtomicityProbe(subject),
    applies: (criterion) => {
      if (criterion.requires === 'conflict' && !subject.conflictingUpdates) {
        return 'Subject declares no concurrency-conflict seam — not applicable.';
      }
      if (criterion.requires === 'fault-state' && (!subject.faultingMutation || !subject.state || !subject.readState)) {
        return 'Subject declares no fault-and-state seam — not applicable.';
      }
      return null;
    },
  };
}
