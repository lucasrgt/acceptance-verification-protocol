import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `access-control` criteria speak; an adapter implements it. */
export interface AccessControlExpect {
  /** A protected endpoint refused a request without credentials. */
  requiresAuthentication(): void;
}

/**
 * The `access-control` archetype — the baseline auth boundary. Richer authorization
 * criteria prove caller ownership and role semantics; this one proves the endpoint is
 * not anonymously reachable at all.
 */
export const accessControl = archetype('access-control', '0.1.0', () => {
  criterion(
    'requires-authentication',
    'A protected endpoint refuses an unauthenticated request (401/403) — it is never silently reachable without a credential. The baseline guard every authenticated slice must hold; richer authorization (own-resource-only, role-required) layers on top.',
    { under: 'api-error', scope: 'invariant' },
    mechanical<AccessControlExpect>(async ({ act, expect }) => {
      await act();
      expect.requiresAuthentication();
    }),
  );
});
