import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `authorization` criteria speak; the adapter implements it. */
export interface AuthorizationExpect {
  /** A request as one account for another account's resource was refused (no cross-account access). */
  ownResourceOnly(): void;
  /** A privileged operation was refused when called as a role that should not have it. */
  roleRequired(): void;
}

/**
 * The `authorization` archetype — "a caller acts only on resources it owns". The
 * backend half of persona-scoped-visibility; IDOR is the recurring shape. This is
 * the FIRST backend archetype, observed over HTTP (not the DOM) — so it runs
 * through the HTTP adapter against ANY backend, language-neutral. Mined as the
 * marketplace's `UpdateHost`-by-id-alone (1db3c2fd) and confirmed cross-stack in
 * .NET (bitwarden: cross-organization IDOR in bulk user revoke). See
 * docs/catalog.md #7 and docs/corpus-multistack.md.
 */
export const authorization = archetype('authorization', '0.1.0', () => {
  criterion(
    'own-resource-only',
    "A write resolves the target scoped to the caller; another account's id is refused (401/403/404), never a cross-account write.",
    { under: 'success', scope: 'invariant', requires: 'ownership', seenIn: ['1db3c2fd', 'bitwarden:0ad7a10c'] },
    mechanical<AuthorizationExpect>(async ({ act, expect }) => {
      await act();
      expect.ownResourceOnly();
    }),
  );

  criterion(
    'role-required',
    'An endpoint enforces the role its operation implies; a privileged op called as a lesser role is refused — "any authenticated" is not a policy.',
    { under: 'success', scope: 'invariant', requires: 'role', seenIn: ['d36af822', 'gitea:171df0c9'] },
    mechanical<AuthorizationExpect>(async ({ act, expect }) => {
      await act();
      expect.roleRequired();
    }),
  );
});
