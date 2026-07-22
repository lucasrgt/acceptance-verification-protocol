import { archetype, criterion, mechanical } from '../core/dsl';

/** Assertion vocabulary for backend dependency-failure honesty. */
export interface FailureHonestyExpect {
  /** The operation's response admits that its required dependency failed. */
  dependencyFailureAdmitted(): void;
}

/** A dependency failure is observable at the operation boundary, never swallowed as success. */
export const failureHonesty = archetype('failure-honesty', '0.1.0', () => {
  criterion(
    'dependency-failure-is-admitted',
    'When a required dependency is forced to fail, the operation admits failure through a non-success response or its declared error envelope — it never returns a bare success while the effect was lost.',
    { under: 'api-error', scope: 'invariant', requires: 'dependency-failure', seenIn: ['pauta:381187c', 'pauta:b831091', 'hostpoint:4b5f4230'] },
    mechanical<FailureHonestyExpect>(async ({ act, expect }) => {
      await act();
      expect.dependencyFailureAdmitted();
    }),
  );
});
