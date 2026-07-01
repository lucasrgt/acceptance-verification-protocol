import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `credential-authority` criteria speak; an adapter implements it. */
export interface CredentialAuthorityExpect {
  /** Invalid credentials were denied and no token was issued. */
  rejectsInvalidCredentials(): void;
  /** Valid credentials minted a session token. */
  issuesTokenOnValid(): void;
}

/** The `credential-authority` archetype — authentication endpoints are the authority on credentials. */
export const credentialAuthority = archetype('credential-authority', '0.1.0', () => {
  criterion(
    'rejects-invalid-credentials',
    'An authentication endpoint denies invalid credentials and never issues a token on the deny path — a silent accept (a token for a wrong credential) is an auth bypass.',
    { under: 'api-error', scope: 'invariant' },
    mechanical<CredentialAuthorityExpect>(async ({ act, expect }) => {
      await act();
      expect.rejectsInvalidCredentials();
    }),
  );

  criterion(
    'issues-token-on-valid',
    'An authentication endpoint issues a session token for valid credentials.',
    { under: 'success', scope: 'invariant' },
    mechanical<CredentialAuthorityExpect>(async ({ act, expect }) => {
      await act();
      expect.issuesTokenOnValid();
    }),
  );
});
