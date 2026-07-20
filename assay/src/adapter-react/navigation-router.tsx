import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AnyRouter } from '@tanstack/react-router';
import { AvpFail, type Probe } from '../core/dsl';
import type { NavigationExpect } from '../archetypes/navigation-integrity';
import { settle } from './settle';

/**
 * Descriptor of a router-mounted navigation subject. Unlike the navigate-spy
 * subject (which checks where an affordance *points*), this mounts a REAL router
 * and checks behaviour the spy can't see:
 *  - `nested-renders`: the nested destination actually renders (parent has its
 *    `<Outlet/>`), not a blank screen.
 *  - `back-has-fallback`: opened deep with no history, Back lands somewhere real.
 */
export interface RouterNavSubject {
  readonly name: string;
  /** A freshly-configured router (memory history already pointed at the target). */
  readonly router: () => AnyRouter;
  /** A marker that must be visible once navigation settles (nested-renders). */
  readonly childMarker?: string | RegExp;
  /** The back affordance + the marker that proves Back landed on a fallback (back-has-fallback). */
  readonly back?: {
    readonly trigger: { readonly role: string; readonly name: string | RegExp };
    readonly fallbackMarker: string | RegExp;
  };
  /**
   * Mounted at a param-less route, the guard must redirect to a real parent
   * (`fallbackMarker` present) and must NOT render the detail with a missing param
   * (`ghostMarker` absent, when given). (required-params-guarded)
   */
  readonly paramGuard?: {
    readonly fallbackMarker: string | RegExp;
    readonly ghostMarker?: string | RegExp;
  };
  /**
   * Mounted where a guard fires, the router must settle in finitely many hops — not
   * bounce between routes forever. `maxHops` is the load-count past which it's a
   * storm (default 8). (no-redirect-loop)
   */
  readonly redirectLoop?: { readonly maxHops?: number };
}

const present = (marker: string | RegExp): boolean => {
  const text = document.body.textContent ?? '';
  return typeof marker === 'string' ? text.includes(marker) : marker.test(text);
};

/** The React adapter's router-mounted `navigation-integrity` probe. */
export function routerProbe(subject: RouterNavSubject): Probe<NavigationExpect> {
  let acted = false;
  let hops = 0;
  let mountError: Error | null = null;
  return {
    async act() {
      cleanup();
      const user = userEvent.setup();
      const router = subject.router();
      const { RouterProvider } = await import('@tanstack/react-router');
      let unsub: (() => void) | undefined;
      if (subject.redirectLoop) {
        // Count each route-load attempt; a redirect storm fires it until the router
        // bails (or far past a healthy guard's one or two hops).
        try {
          unsub = (router as { subscribe?: (e: string, cb: () => void) => () => void }).subscribe?.(
            'onBeforeLoad',
            () => {
              hops++;
            },
          );
        } catch {
          /* subscribe shape differs — fall back to the mount-error signal */
        }
      }
      try {
        render(<RouterProvider router={router} />);
        await settle(80);
      } catch (e) {
        mountError = e as Error;
      }
      unsub?.();
      if (subject.back) {
        const el = screen.queryByRole(subject.back.trigger.role, { name: subject.back.trigger.name });
        if (el) await user.click(el);
        await settle(80);
      }
      acted = true;
    },
    expect: {
      everyTargetResolves() {
        throw new AvpFail('everyTargetResolves is not applicable to a router-mounted subject.');
      },
      nestedRenders() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (!subject.childMarker) throw new AvpFail('nestedRenders needs a childMarker on the subject.');
        if (!present(subject.childMarker)) {
          throw new AvpFail(
            `Navigated to the nested route but its content ("${String(subject.childMarker)}") never rendered — a blank screen. The parent layout is missing its <Outlet/> (or the equivalent nested-route slot).`,
            {},
          );
        }
      },
      backHasFallback() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (!subject.back) throw new AvpFail('backHasFallback needs a `back` seam on the subject.');
        if (!present(subject.back.fallbackMarker)) {
          throw new AvpFail(
            `Back was a dead no-op: opened deep with no history, pressing back did not land on the fallback ("${String(subject.back.fallbackMarker)}"). Fall back to a real route when there is nothing to pop (canGoBack ? back() : navigate(fallback)).`,
            {},
          );
        }
      },
      requiredParamsGuarded() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (!subject.paramGuard) throw new AvpFail('requiredParamsGuarded needs a `paramGuard` seam on the subject.');
        const { fallbackMarker, ghostMarker } = subject.paramGuard;
        if (!present(fallbackMarker)) {
          throw new AvpFail(
            `A param-less route did not redirect to its real parent ("${String(fallbackMarker)}") — it rendered the detail with a missing param (a ghost screen). Guard the route: when the required param is absent or empty, redirect to the parent instead of rendering.`,
            {},
          );
        }
        if (ghostMarker && present(ghostMarker)) {
          throw new AvpFail(
            `A param-less route rendered the detail ("${String(ghostMarker)}") instead of (or alongside) redirecting — the missing-param ghost is still visible. The guard must redirect before the detail mounts.`,
            {},
          );
        }
      },
      noRedirectLoop() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (!subject.redirectLoop) throw new AvpFail('noRedirectLoop needs a `redirectLoop` seam on the subject.');
        const max = subject.redirectLoop.maxHops ?? 8;
        const stormy = mountError !== null && /redirect|loop|maximum|infinite|invariant/i.test(mountError.message);
        if (hops > max || stormy) {
          throw new AvpFail(
            `A guard/redirect did not resolve in finitely many hops (${hops} route load(s)${mountError ? `; ${mountError.message}` : ''}) — a redirect storm. Make the guard a fixed point: redirect only when it changes the destination, and let the target route render.`,
            { hops, error: mountError?.message },
          );
        }
      },
    },
  };
}

/** True for a router-mounted subject (vs the navigate-spy subject). */
export function isRouterSubject(subject: unknown): subject is RouterNavSubject {
  return typeof subject === 'object' && subject !== null && typeof (subject as RouterNavSubject).router === 'function';
}
