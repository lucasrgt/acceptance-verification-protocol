import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `mount-stability` criteria speak; the adapter implements it. */
export interface MountStabilityExpect {
  /** Mounting the screen settled to a bounded number of requests (no refetch/redirect storm). */
  settlesWithoutStorm(): void;
}

/**
 * The `mount-stability` archetype — "a screen settles on mount". A guard or effect
 * that re-fires (a redirect loop, an unstable query that refetches on every
 * render) turns a mount into a request storm that freezes the boot splash — the
 * test "rendered the screen" and passed; the user got a frozen app. Mined as
 * near-identical escapes in two independent projects (the anonymous /me storm).
 * See docs/catalog.md #1 (no-redirect-loop).
 */
export const mountStability = archetype('mount-stability', '0.1.0', () => {
  criterion(
    'settles-without-storm',
    'Mounting a screen settles to a bounded number of requests — no refetch/redirect storm that freezes the screen.',
    { under: 'success', scope: 'invariant', seenIn: ['e6c81abe', 'projp:626c8ce'] },
    mechanical<MountStabilityExpect>(async ({ act, expect }) => {
      await act();
      expect.settlesWithoutStorm();
    }),
  );
});
