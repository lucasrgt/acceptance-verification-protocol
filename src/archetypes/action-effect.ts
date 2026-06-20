import { archetype, criterion, mechanical, model } from '../core/dsl';

/** The assertion vocabulary `action-effect` criteria speak; the adapter implements it. */
export interface ActionEffectExpect {
  /** The action produced its primary effect (a request to the domain endpoint). */
  effectFired(): void;
  /** The user input survived a failed action (no phantom success). */
  draftSurvived(): void;
  /** An error was made visible to the user. */
  errorShown(): void;
  /** A sibling projection (list/badge/count) reflected a successful mutation. */
  projectionConverged(): void;
  /** The request body the UI sent conforms to the backend's contract (not a 400). */
  requestAccepted(): void;
  /** A retry of the same action did not duplicate the effect. */
  idempotentRetry(): void;
  /** An expired token mid-action recovered via refresh and the effect still happened. */
  survivesTokenRefresh(): void;
  /** No success affirmation was shown after a failed action (no phantom success). */
  noFalseSuccess(): void;
  /** After an identity switch, the prior identity's cached rows are gone and the new identity's data loads. */
  cacheClearedOnIdentity(): void;
}

/**
 * The `action-effect` archetype — "an action produces its real effect".
 *
 * Authored declaratively (reads like a test file) yet framework-neutral: the
 * mechanical bodies speak through the AVP `probe`, which the adapter provides.
 * Chosen by error analysis over the fix history of a real-world tourism project
 * (see docs/genesis.md and the full catalog in docs/catalog.md). This executable
 * spec grows as each oracle lands.
 */
export const actionEffect = archetype('action-effect', '0.1.0', () => {
  criterion(
    'fires-primary-effect',
    'The action fires its primary effect; no visible action is a no-op.',
    { under: 'success', scope: 'invariant', seenIn: ['615ed1a7', '92d99ad2'] },
    mechanical<ActionEffectExpect>(async ({ act, expect }) => {
      await act();
      expect.effectFired();
    }),
  );

  criterion(
    'no-phantom-success',
    'On failure, the user input persists and an error is visible — never a phantom success.',
    { under: 'api-error', scope: 'invariant', requires: 'input', seenIn: ['04677bf9'] },
    mechanical<ActionEffectExpect>(async ({ act, expect }) => {
      await act();
      expect.draftSurvived();
      expect.errorShown();
      expect.noFalseSuccess();
    }),
  );

  criterion(
    'error-is-specific',
    'On failure, the error message names the real problem and a next step — not a generic "something went wrong".',
    { under: 'api-error', scope: 'invariant', requires: 'input' },
    model(
      'Read the visible text after a failed action. PASS if the error message identifies what failed and suggests a next step; FAIL if it is generic, absent, or blames the user.',
    ),
  );

  criterion(
    'projections-converge',
    'After a successful mutation, sibling projections of the data (lists, badges, counts) reflect the change without a manual reload.',
    { under: 'success', scope: 'invariant', requires: 'projection', seenIn: ['b9659b46', '5a0f2acb'] },
    mechanical<ActionEffectExpect>(async ({ act, expect }) => {
      await act();
      expect.effectFired();
      expect.projectionConverged();
    }),
  );

  criterion(
    'request-accepted',
    'The request the UI sends is well-formed enough for the backend to accept it — no 400 from a malformed body (e.g. a datetime where a date-only field is expected).',
    { under: 'success', scope: 'invariant', requires: 'contract', seenIn: ['c1849234'] },
    mechanical<ActionEffectExpect>(async ({ act, expect }) => {
      await act();
      expect.requestAccepted();
    }),
  );

  criterion(
    'idempotent-retry',
    'A retry after a partial failure does not duplicate the effect — the same logical action fires once.',
    { under: 'retry', scope: 'invariant', requires: 'retryable', seenIn: ['0188869f'] },
    mechanical<ActionEffectExpect>(async ({ act, expect }) => {
      await act();
      expect.idempotentRetry();
    }),
  );

  criterion(
    'survives-token-refresh',
    'An expired token mid-action recovers via a refresh-and-retry instead of erroring the user.',
    { under: 'token-expired', scope: 'invariant', requires: 'refresh', seenIn: ['b4b0fc07'] },
    mechanical<ActionEffectExpect>(async ({ act, expect }) => {
      await act();
      expect.survivesTokenRefresh();
    }),
  );

  criterion(
    'cache-cleared-on-identity',
    'Signing in/out wipes the prior identity\'s cached rows: after an identity switch, the previous account\'s data never feeds the new session — the UI shows the new identity\'s data, not the old.',
    { under: 'success', scope: 'invariant', requires: 'identity', seenIn: ['documenso:8fca029d', 'documenso:d2976cb1'] },
    mechanical<ActionEffectExpect>(async ({ act, expect }) => {
      await act();
      expect.cacheClearedOnIdentity();
    }),
  );
});
