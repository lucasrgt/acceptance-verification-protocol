import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `navigation-integrity` criteria speak; the adapter implements it. */
export interface NavigationExpect {
  /** Every affordance that navigates targets a registered route (no dead ends / not-found). */
  everyTargetResolves(): void;
  /** Navigating to a nested route actually renders its content (the parent layout has its outlet). */
  nestedRenders(): void;
  /** Back is never a dead no-op: with no history it lands on a real fallback. */
  backHasFallback(): void;
  /** A route that needs a param redirects to a real parent when the param is absent/empty (not a ghost). */
  requiredParamsGuarded(): void;
  /** A guard/redirect resolves in finitely many hops — no redirect storm / replace-in-effect loop. */
  noRedirectLoop(): void;
}

/**
 * The `navigation-integrity` archetype — "every affordance leads somewhere real".
 *
 * The single largest escape class in the mined history, and it recurs across
 * independent projects (a marketplace's RN routes, a SaaS's TanStack routes): an
 * action navigates, but the destination is wrong, unregistered, or unreachable —
 * the test "tapped the button" and passed; the user hit a dead end. See
 * docs/catalog.md #1.
 */
export const navigationIntegrity = archetype('navigation-integrity', '0.1.0', () => {
  criterion(
    'target-resolves',
    'Every navigation affordance targets a registered route; no tap lands on not-found.',
    { under: 'success', scope: 'invariant', requires: 'routes', seenIn: ['287ab352', '2a3f9251', 'projp:7ba900d'] },
    mechanical<NavigationExpect>(async ({ act, expect }) => {
      await act();
      expect.everyTargetResolves();
    }),
  );

  criterion(
    'nested-renders',
    'Navigating to a nested route renders its content — the parent layout renders its outlet, not a blank screen.',
    { under: 'success', scope: 'invariant', requires: 'router', seenIn: ['projp:37af286', 'projp:039aaf2'] },
    mechanical<NavigationExpect>(async ({ act, expect }) => {
      await act();
      expect.nestedRenders();
    }),
  );

  criterion(
    'back-has-fallback',
    'Back is never a dead no-op: opened deep with no history, it lands on a real fallback instead of doing nothing.',
    { under: 'success', scope: 'invariant', requires: 'router', seenIn: ['3aa1c80a'] },
    mechanical<NavigationExpect>(async ({ act, expect }) => {
      await act();
      expect.backHasFallback();
    }),
  );

  criterion(
    'required-params-guarded',
    'A route that needs a param redirects to a real parent when the param is absent or empty — it never renders the detail with an undefined/empty param (a ghost screen).',
    { under: 'success', scope: 'invariant', requires: 'router', seenIn: ['documenso:184cbd67', 'documenso:04b1ce1a'] },
    mechanical<NavigationExpect>(async ({ act, expect }) => {
      await act();
      expect.requiredParamsGuarded();
    }),
  );

  criterion(
    'no-redirect-loop',
    'A guard/redirect resolves in finitely many hops: opened where a guard fires, the router settles on a real screen — it never bounces between routes forever (a replace-in-effect storm).',
    { under: 'success', scope: 'invariant', requires: 'router', seenIn: ['documenso:849885b5', 'documenso:ef79eb3c'] },
    mechanical<NavigationExpect>(async ({ act, expect }) => {
      await act();
      expect.noRedirectLoop();
    }),
  );
});
