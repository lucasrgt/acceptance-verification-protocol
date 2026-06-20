import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  redirect,
  Outlet,
} from '@tanstack/react-router';

/**
 * Faithful reproduction of the redirect-loop escape (the marketplace's role-select
 * infinite redirect loop): a guard/redirect doesn't resolve to a fixed point, so the
 * routes bounce between each other. The class recurs wherever auth/role redirect
 * guards aren't fixed points (documenso's login/dashboard redirect guards).
 *
 *   /home  — needs a role; redirects to /role when there isn't one
 *   /role  — the role chooser
 *   /pick  — a third hop (for the 3-cycle)
 *
 * Signed in with NO role. A correct /role renders the chooser (settles after one
 * redirect). The bad variants bounce — modelled with a per-router hop CAP so the
 * storm is observable and the test terminates instead of hanging forever. A real
 * loop and a CAP-bounded storm are identical to the criterion: both fail to settle
 * in finitely-few hops.
 *
 * Variants:
 *   good          : /role renders the chooser (fixed point — settles in 2 hops)
 *   two-cycle      : /home ⇄ /role
 *   three-cycle    : /home → /role → /pick → /home
 *   always-redirect: /role always redirects to /home
 */
export type LoopVariant = 'good' | 'two-cycle' | 'three-cycle' | 'always-redirect';

/** Above the criterion's maxHops, finite so the test ends. */
const CAP = 20;

function build(variant: LoopVariant) {
  const role: string | null = null; // signed in, no role yet
  let hops = 0;
  const storming = () => ++hops <= CAP; // true while the storm is still bouncing

  const rootRoute = createRootRoute({ component: () => <Outlet /> });

  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/home',
    beforeLoad: () => {
      if (!role && storming()) throw redirect({ to: '/role' });
    },
    component: () => <h1>Home</h1>,
  });

  const pickRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/pick',
    beforeLoad: () => {
      if (variant === 'three-cycle' && storming()) throw redirect({ to: '/home' });
    },
    component: () => <h1>Pick</h1>,
  });

  const roleRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/role',
    beforeLoad: () => {
      if (variant === 'two-cycle' && !role && storming()) throw redirect({ to: '/home' });
      if (variant === 'three-cycle' && storming()) throw redirect({ to: '/pick' });
      if (variant === 'always-redirect' && storming()) throw redirect({ to: '/home' });
      // good: no redirect — render the chooser (the fixed point)
    },
    component: () => <h1>Choose your role</h1>,
  });

  const routeTree = rootRoute.addChildren([homeRoute, roleRoute, pickRoute]);
  return createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/home'] }) });
}

export const buildLoopRouter = (variant: LoopVariant) => () => build(variant);
