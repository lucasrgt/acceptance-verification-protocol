import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
  useRouter,
} from '@tanstack/react-router';

/**
 * Faithful reproduction of the dead-back escape (3aa1c80a): opened deep via a
 * link/refresh with no in-app history, a bare router.back() is a no-op — the
 * "Voltar" button does nothing and strands the user.
 *
 * BAD : onBack = router.history.back() — a no-op when there's nothing to pop.
 * GOOD: falls back to a real route when it can't go back.
 */
function makeScreen(variant: 'good' | 'bad') {
  return function SettingsScreen() {
    const router = useRouter();
    const onBack = () => {
      if (variant === 'bad') {
        router.history.back(); // dead no-op with no history
      } else if (router.history.canGoBack?.()) {
        router.history.back();
      } else {
        void router.navigate({ to: '/' }); // fall back to a real route
      }
    };
    return (
      <div>
        <h1>Settings</h1>
        <button type="button" onClick={onBack}>
          Voltar
        </button>
      </div>
    );
  };
}

function buildBackRouter(variant: 'good' | 'bad') {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <div>Home dashboard</div>,
  });
  const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'settings',
    component: makeScreen(variant),
  });
  const routeTree = rootRoute.addChildren([homeRoute, settingsRoute]);
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/settings'] }), // deep, no back history
  });
}

export const GoodBack = () => buildBackRouter('good');
export const BadBack = () => buildBackRouter('bad');
