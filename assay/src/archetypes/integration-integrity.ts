import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `integration-integrity` criteria speak; the adapter implements it. */
export interface IntegrationExpect {
  /** A forged/absent-signature webhook was refused, and a correctly-signed one accepted. */
  webhookSignatureVerified(): void;
  /** State contains exactly the authentic webhook effect and no forged effect. */
  webhookEffectsState(): void;
  /** A checkout/OAuth flow's return URLs are present, absolute, and bound to a real environment. */
  redirectUrlsBound(): void;
  /** A callback that can't be tied to a domain entity is refused — never accepted-and-misapplied. */
  callbackResolvesEntity(): void;
}

/**
 * The `integration-integrity` archetype — "external callbacks are verified before
 * they mutate state". A backend archetype, HTTP-observable. The webhook-signature
 * shape recurs in every backend-heavy app in the corpus (gitea, documenso,
 * mastodon, bitwarden). Mined as the marketplace's unverified payment-provider
 * webhook (692d85af) and missing-back_urls checkout. Confirmed cross-stack in .NET
 * by bitwarden's missing-RedirectUris fixes (aa1665065, 004e3c58e). Two seams, each
 * gating its own criterion. See docs/catalog.md #5 and docs/corpus-multistack.md.
 */
export const integrationIntegrity = archetype('integration-integrity', '0.2.0', () => {
  criterion(
    'webhook-signature-verified',
    'An inbound webhook with a forged or absent signature is rejected; only an authentically-signed callback is accepted and allowed to mutate state.',
    { under: 'success', scope: 'invariant', requires: 'webhook', seenIn: ['692d85af', 'documenso:3887aa67'] },
    mechanical<IntegrationExpect>(async ({ act, expect }) => {
      await act();
      expect.webhookSignatureVerified();
    }),
  );

  criterion(
    'webhook-effects-state',
    'After one authentic and one forged webhook are delivered, domain state reflects exactly the authentic event: the valid event is applied once and the forged event leaves no trace, even when the provider-facing endpoint answers 2xx to both.',
    { under: 'success', scope: 'invariant', requires: 'webhook-state', seenIn: ['hostpoint:53fcf804', 'avp:8d6169d0'] },
    mechanical<IntegrationExpect>(async ({ act, expect }) => {
      await act();
      expect.webhookEffectsState();
    }),
  );

  criterion(
    'redirect-urls-bound',
    'A checkout/OAuth flow binds its return URLs to the real environment: every required transition (success, failure) is present, an absolute http(s) URL, and never a placeholder, relative path, or dev host.',
    { under: 'success', scope: 'invariant', requires: 'checkout', seenIn: ['bitwarden:aa1665065', 'bitwarden:004e3c58e'] },
    mechanical<IntegrationExpect>(async ({ act, expect }) => {
      await act();
      expect.redirectUrlsBound();
    }),
  );

  criterion(
    'callback-resolves-entity',
    'An inbound callback carries enough to resolve the domain entity it concerns: a callback with a missing or unknown reference is refused, never accepted and silently dropped or applied to the wrong entity.',
    { under: 'success', scope: 'invariant', requires: 'resolve', seenIn: ['documenso:a99bdf5e', 'documenso:8fbace0f'] },
    mechanical<IntegrationExpect>(async ({ act, expect }) => {
      await act();
      expect.callbackResolvesEntity();
    }),
  );
});
