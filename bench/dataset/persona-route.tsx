import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  redirect,
  Outlet,
} from '@tanstack/react-router';

/**
 * Faithful reproduction of the cross-persona route escape (the marketplace's
 * opposite-persona dashboard rendering on a deep link): signed in as a traveler, a
 * deep link to a HOST-scoped route renders the host's dashboard instead of refusing
 * and redirecting to the traveler's own area. The class recurs across stacks at the
 * page/route level (documenso's team-scoped page access; bitwarden's cross-context
 * settings leak).
 *
 *   /traveler/home   — the actor's own area (where a refused actor must land)
 *   /host/dashboard  — a HOST-scoped route (must not render for a traveler)
 *   /host/list       — another host route (a wrong redirect target)
 *
 * Actor signed in: traveler.
 *
 * Variants:
 *   good              : guard redirects a non-host to /traveler/home
 *   no-guard           : renders the host dashboard for anyone
 *   wrong-actor-check  : guards only the anonymous (a logged-in traveler slips through)
 *   redirect-wrong     : redirects a non-host to /host/list (still a host route)
 *   splash-only        : the guard lives on /login, not the route — a deep link renders it
 */
export type PersonaRouteVariant = 'good' | 'no-guard' | 'wrong-actor-check' | 'redirect-wrong' | 'splash-only';

const ACTOR: string = 'traveler';

function build(variant: PersonaRouteVariant) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });

  const travelerHome = createRoute({
    getParentRoute: () => rootRoute,
    path: '/traveler/home',
    component: () => <h1>Traveler home</h1>,
  });

  const hostList = createRoute({
    getParentRoute: () => rootRoute,
    path: '/host/list',
    component: () => <h1>Host listings</h1>,
  });

  const guard = () => {
    if (variant === 'good' && ACTOR !== 'host') throw redirect({ to: '/traveler/home' });
    if (variant === 'wrong-actor-check' && !ACTOR) throw redirect({ to: '/traveler/home' }); // only blocks anonymous
    if (variant === 'redirect-wrong' && ACTOR !== 'host') throw redirect({ to: '/host/list' }); // wrong target
    // no-guard / splash-only: no route guard at all
  };

  const hostDashboard = createRoute({
    getParentRoute: () => rootRoute,
    path: '/host/dashboard',
    beforeLoad: guard,
    component: () => <h1>Host dashboard</h1>,
  });

  const routeTree = rootRoute.addChildren([travelerHome, hostList, hostDashboard]);
  return createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/host/dashboard'] }) });
}

export const buildPersonaRouter = (variant: PersonaRouteVariant) => () => build(variant);
export const SIGNED_IN_ACTOR = ACTOR;
