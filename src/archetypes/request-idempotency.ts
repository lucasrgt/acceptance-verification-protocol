import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `request-idempotency` criteria speak; the adapter implements it. */
export interface IdempotencyExpect {
  /** Two requests carrying the same idempotency key produced ONE effect (the original, replayed); a different key produced a distinct one. */
  idempotencyKeyHonored(): void;
}

/**
 * The `request-idempotency` archetype — "a mutation carrying an idempotency key is
 * applied at most once". The backend counterpart of action-effect's `single-flight`:
 * single-flight guards the BUTTON in the client; this guards the EFFECT at the
 * server, so a retried/duplicated request (a flaky network, a double POST, a webhook
 * redelivery) does not create a second resource. The server must persist the key and
 * replay the original result on a repeat — and scope the dedup to the key, so a
 * genuinely different operation still creates its own resource.
 *
 * A backend archetype, HTTP-observable. Faithfully grounded: cal.com "Prevent
 * duplicate bookings with idempotency key" (d85e0b51) and documenso's "rework stripe
 * webhooks into idempotent subscription sync".
 */
export const requestIdempotency = archetype('request-idempotency', '0.1.0', () => {
  criterion(
    'idempotency-key-honored',
    'A mutation carrying an idempotency key is applied at most once: two requests with the SAME key yield one resource (the original, replayed), and a request with a DIFFERENT key yields a distinct resource. Persist the key and replay on a repeat — never re-create, never dedup regardless of the key.',
    { under: 'success', scope: 'invariant', seenIn: ['calcom:d85e0b51', 'documenso:3887aa67', 'documenso:31be5489'] },
    mechanical<IdempotencyExpect>(async ({ act, expect }) => {
      await act();
      expect.idempotencyKeyHonored();
    }),
  );
});
