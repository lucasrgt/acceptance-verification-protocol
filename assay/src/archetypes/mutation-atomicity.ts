import { archetype, criterion, mechanical } from '../core/dsl';

/** Assertion vocabulary for observable concurrency and transaction boundaries. */
export interface MutationAtomicityExpect {
  /** Exactly one same-token update wins; the other returns an explicit conflict. */
  concurrentConflictSurfaces(): void;
  /** A forced mid-mutation fault leaves observable state unchanged. */
  multiWriteIsAtomic(): void;
}

/** Runtime proof that multi-write mutations neither lose conflicts nor leak partial state. */
export const mutationAtomicity = archetype('mutation-atomicity', '0.1.0', () => {
  criterion(
    'concurrent-conflict-surfaces',
    'Two conflicting updates carrying the same concurrency token cannot both succeed: exactly one wins and the loser receives an explicit conflict response (409/412), never silent last-write-wins.',
    { under: 'double-activate', scope: 'invariant', requires: 'conflict', seenIn: ['pauta:f85820f', 'fluxoterra:1b479706'] },
    mechanical<MutationAtomicityExpect>(async ({ act, expect }) => {
      await act();
      expect.concurrentConflictSurfaces();
    }),
  );
  criterion(
    'multi-write-is-atomic',
    'When a fault is forced after one write in a multi-write mutation, the request fails and the observable state is identical to its baseline — no partial write escapes the transaction.',
    { under: 'api-error', scope: 'invariant', requires: 'fault-state', seenIn: ['pauta:b00c9c4', 'hostpoint:c0a0c63c'] },
    mechanical<MutationAtomicityExpect>(async ({ act, expect }) => {
      await act();
      expect.multiWriteIsAtomic();
    }),
  );
});
