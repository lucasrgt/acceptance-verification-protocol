import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { RouterProvider, type AnyRouter } from '@tanstack/react-router';
import { AvpFail, type Probe } from '../core/dsl';
import type { NavigationExpect } from '../archetypes/navigation-integrity';

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
}

const present = (marker: string | RegExp): boolean => {
  const text = document.body.textContent ?? '';
  return typeof marker === 'string' ? text.includes(marker) : marker.test(text);
};

const settle = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 80));
  });

/** The React adapter's router-mounted `navigation-integrity` probe. */
export function routerProbe(subject: RouterNavSubject): Probe<NavigationExpect> {
  let acted = false;
  return {
    async act() {
      cleanup();
      const user = userEvent.setup();
      render(<RouterProvider router={subject.router()} />);
      await settle();
      if (subject.back) {
        const el = screen.queryByRole(subject.back.trigger.role, { name: subject.back.trigger.name });
        if (el) await user.click(el);
        await settle();
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
    },
  };
}

/** True for a router-mounted subject (vs the navigate-spy subject). */
export function isRouterSubject(subject: unknown): subject is RouterNavSubject {
  return typeof subject === 'object' && subject !== null && typeof (subject as RouterNavSubject).router === 'function';
}
