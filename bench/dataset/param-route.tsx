import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  redirect,
  Outlet,
} from '@tanstack/react-router';

/**
 * Faithful reproduction of the required-param escape (the marketplace's param-less
 * chat thread rendering a ghost): a route that needs a param is opened without it
 * (deep link / stale link) and, instead of redirecting to a real parent, it renders
 * the detail with an undefined/empty param — a ghost screen. The class recurs in
 * frontend-routed apps across stacks.
 *
 *   /inbox            — the real parent (the list); where a missing param must land
 *   /messages?thread  — the detail; needs `thread`
 *
 * Variants:
 *   good          : beforeLoad redirects to /inbox when thread is absent OR empty
 *   no-guard       : renders the conversation with an undefined param (a ghost)
 *   empty-allowed  : guards only `=== undefined`, so an empty ?thread= slips through
 *   spinner        : no guard — a perpetual "Loading conversation…" that never resolves
 *   blank          : no guard — renders nothing at all
 */
export type ParamVariant = 'good' | 'no-guard' | 'empty-allowed' | 'spinner' | 'blank';

type Search = { thread: string | undefined };

function build(variant: ParamVariant) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });

  const inboxRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/inbox',
    component: () => (
      <div>
        <h1>Inbox</h1>
        <ul>
          <li>Chat with Ana</li>
        </ul>
      </div>
    ),
  });

  const guard = (search: Search) => {
    if (variant === 'good' && !search.thread) throw redirect({ to: '/inbox' });
    if (variant === 'empty-allowed' && search.thread === undefined) throw redirect({ to: '/inbox' });
  };

  const ConversationScreen = () => {
    const { thread } = messagesRoute.useSearch();
    if (variant === 'spinner') return <div role="status">Loading conversation…</div>;
    if (variant === 'blank') return <></>;
    return (
      <div>
        <h1>Conversation</h1>
        {thread ? <p>Thread {thread}</p> : <p>Thread —</p>}
      </div>
    );
  };

  const messagesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/messages',
    validateSearch: (s: Record<string, unknown>): Search => ({
      thread: typeof s.thread === 'string' ? s.thread : undefined,
    }),
    beforeLoad: ({ search }: { search: Search }) => guard(search),
    component: ConversationScreen,
  });

  const routeTree = rootRoute.addChildren([inboxRoute, messagesRoute]);
  const initialEntries = variant === 'empty-allowed' ? ['/messages?thread='] : ['/messages'];
  return createRouter({ routeTree, history: createMemoryHistory({ initialEntries }) });
}

export const buildParamRouter = (variant: ParamVariant) => () => build(variant);
