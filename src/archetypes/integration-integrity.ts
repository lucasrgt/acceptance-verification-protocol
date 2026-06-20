import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `integration-integrity` criteria speak; the adapter implements it. */
export interface IntegrationExpect {
  /** A forged/absent-signature webhook was refused, and a correctly-signed one accepted. */
  webhookSignatureVerified(): void;
}

/**
 * The `integration-integrity` archetype — "external callbacks are verified before
 * they mutate state". A backend archetype, HTTP-observable. The webhook-signature
 * shape recurs in every backend-heavy app in the corpus (gitea, documenso,
 * mastodon, bitwarden). Mined as the marketplace's unverified payment-provider
 * webhook (692d85af). See docs/catalog.md #5 and docs/corpus-multistack.md.
 */
export const integrationIntegrity = archetype('integration-integrity', '0.1.0', () => {
  criterion(
    'webhook-signature-verified',
    'An inbound webhook with a forged or absent signature is rejected; only an authentically-signed callback is accepted and allowed to mutate state.',
    { under: 'success', scope: 'invariant', seenIn: ['692d85af', 'documenso:3887aa67'] },
    mechanical<IntegrationExpect>(async ({ act, expect }) => {
      await act();
      expect.webhookSignatureVerified();
    }),
  );
});
