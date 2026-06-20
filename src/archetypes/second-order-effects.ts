import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `second-order-effects` criteria speak; the adapter implements it. */
export interface SecondOrderExpect {
  /** Every party the transition concerns received its notification. */
  notifiesAllParties(): void;
}

/**
 * The `second-order-effects` archetype — "a transition fires ALL its downstream
 * effects". A backend archetype, HTTP-observable via the parties' inboxes. This is
 * the single largest backend escape cluster in the corpus (mastodon 115, gitea 80,
 * bitwarden 38). Mined as the marketplace's "notify both parties on every booking
 * transition" (81c919ed). See docs/catalog.md #6.
 */
export const secondOrderEffects = archetype('second-order-effects', '0.1.0', () => {
  criterion(
    'notifies-all-parties',
    'Every state transition notifies every party it concerns — both sides of a booking, both ends of a message — not one party or none.',
    { under: 'success', scope: 'invariant', seenIn: ['81c919ed', 'fbc56236'] },
    mechanical<SecondOrderExpect>(async ({ act, expect }) => {
      await act();
      expect.notifiesAllParties();
    }),
  );
});
