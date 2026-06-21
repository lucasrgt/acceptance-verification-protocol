import type { ReactElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { NavigationExpect } from '../archetypes/navigation-integrity';
import { routerProbe, isRouterSubject, type RouterNavSubject } from './navigation-router';

/**
 * Descriptor of a `navigation-integrity` subject. The component renders with an
 * injected `navigate` spy (Assay rides the substrate — it doesn't mount a real
 * router); the subject declares which routes actually resolve. Captures every
 * navigation an affordance triggers and checks each target against the table.
 */
export interface NavigationSubject {
  readonly name: string;
  /** Mounts the screen, wiring its navigations to the injected spy. */
  readonly render: (navigate: (path: string) => void) => ReactElement;
  /** The navigating affordances to exercise (each clicked once). */
  readonly affordances: readonly { readonly role: string; readonly name: string | RegExp }[];
  /** The registered route patterns (exact, or with `:param` segments, or RegExp). */
  readonly registeredRoutes: readonly (string | RegExp)[];
}

function routeMatches(pattern: string, path: string): boolean {
  const re =
    '^' +
    pattern
      .split('/')
      .map((seg) => (seg.startsWith(':') ? '[^/]+' : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      .join('/') +
    '/?$';
  return new RegExp(re).test(path);
}

/** The React adapter's `navigation-integrity` probe. */
export function navProbe(subject: NavigationSubject): Probe<NavigationExpect> {
  const navigations: string[] = [];
  let acted = false;

  return {
    async act() {
      cleanup();
      const user = userEvent.setup();
      render(subject.render((path) => navigations.push(path)));
      for (const a of subject.affordances) {
        const el = screen.queryByRole(a.role, { name: a.name });
        if (el) await user.click(el);
      }
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });
      acted = true;
    },
    expect: {
      everyTargetResolves() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        const resolves = (path: string) =>
          subject.registeredRoutes.some((r) => (typeof r === 'string' ? routeMatches(r, path) : r.test(path)));
        const dead = navigations.filter((p) => !resolves(p));
        if (dead.length > 0) {
          throw new AvpFail(
            `A navigation affordance targets an unregistered route: ${dead.join(', ')}. Point it at a registered route (or register the screen) — otherwise the user lands on not-found.`,
            { dead, registered: subject.registeredRoutes.map(String) },
          );
        }
      },
      nestedRenders() {
        throw new AvpFail('nestedRenders needs a router-mounted subject (declare `router`); not applicable to a navigate-spy subject.');
      },
      backHasFallback() {
        throw new AvpFail('backHasFallback needs a router-mounted subject (declare `router`); not applicable to a navigate-spy subject.');
      },
      requiredParamsGuarded() {
        throw new AvpFail('requiredParamsGuarded needs a router-mounted subject (declare `router`); not applicable to a navigate-spy subject.');
      },
      noRedirectLoop() {
        throw new AvpFail('noRedirectLoop needs a router-mounted subject (declare `router`); not applicable to a navigate-spy subject.');
      },
    },
  };
}

/**
 * The React adapter's hooks for `navigation-integrity`. Dispatches by subject
 * shape: a navigate-spy subject runs `target-resolves`; a router-mounted subject
 * runs `nested-renders`. Each criterion is gated to the subject that can observe it.
 */
export function navHooks(subject: NavigationSubject | RouterNavSubject): VerifyHooks {
  const router = isRouterSubject(subject);
  return {
    probe: () => (router ? routerProbe(subject) : navProbe(subject)),
    applies: (c) => {
      if (c.requires === 'routes' && router) return 'Router-mounted subject — target-resolves not applicable.';
      if (c.requires === 'router' && !router) return 'Navigate-spy subject — not applicable.';
      if (router) {
        const s = subject as RouterNavSubject;
        if (c.id === 'nested-renders' && !s.childMarker) return 'Subject declares no childMarker — nested-renders not applicable.';
        if (c.id === 'back-has-fallback' && !s.back) return 'Subject declares no back seam — back-has-fallback not applicable.';
        if (c.id === 'required-params-guarded' && !s.paramGuard) return 'Subject declares no paramGuard seam — required-params-guarded not applicable.';
        if (c.id === 'no-redirect-loop' && !s.redirectLoop) return 'Subject declares no redirectLoop seam — no-redirect-loop not applicable.';
      }
      return null;
    },
  };
}
