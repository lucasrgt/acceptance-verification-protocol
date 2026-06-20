import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router';

/**
 * Faithful reproduction of the parent-without-Outlet escape (projp 37af286 /
 * 039aaf2): a nested edit route mounts under a detail route, but the detail
 * route's component renders the detail directly WITHOUT <Outlet/>, so navigating
 * to the child changes the URL yet renders nothing — a blank screen.
 *
 * BAD : the parent renders its detail, no <Outlet/>; the edit child never mounts.
 * GOOD: the parent renders <Outlet/>; the edit child mounts.
 */
function buildRouter(parentRendersOutlet: boolean) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });

  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'customers/$id',
    component: parentRendersOutlet
      ? () => (
          <div>
            <h1>Customer</h1>
            <Outlet />
          </div>
        )
      : () => (
          <div>
            <h1>Customer</h1>
          </div>
        ),
  });

  const editRoute = createRoute({
    getParentRoute: () => detailRoute,
    path: 'edit',
    component: () => <div>Edit customer form</div>,
  });

  const routeTree = rootRoute.addChildren([detailRoute.addChildren([editRoute])]);
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/customers/1/edit'] }),
  });
}

export const GoodNested = () => buildRouter(true);
export const BadNested = () => buildRouter(false);
