import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `resource-uniqueness` criteria speak; an adapter implements it. */
export interface ResourceUniquenessExpect {
  /** A second create with the same unique key was rejected instead of duplicating the resource. */
  rejectsDuplicate(): void;
}

/** The `resource-uniqueness` archetype — unique domain keys are enforced at the server boundary. */
export const resourceUniqueness = archetype('resource-uniqueness', '0.1.0', () => {
  criterion(
    'rejects-duplicate',
    'Creating a resource whose unique key already exists is rejected (a conflict) — the second create of the same key must fail, never silently duplicate (a duplicate breaks the invariant the key holds, e.g. one-human-one-account).',
    { under: 'double-activate', scope: 'invariant' },
    mechanical<ResourceUniquenessExpect>(async ({ act, expect }) => {
      await act();
      expect.rejectsDuplicate();
    }),
  );
});
