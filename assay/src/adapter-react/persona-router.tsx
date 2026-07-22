import { cleanup, render } from '@testing-library/react';
import type { AnyRouter } from '@tanstack/react-router';
import { AvpFail, type Probe } from '../core/dsl';
import type { PersonaExpect } from '../archetypes/persona-visibility';
import { settle } from './settle';

/**
 * Descriptor of a router-mounted `persona-scoped-visibility` subject. Unlike the
 * render-as-actor subject (which checks which affordances appear), this mounts a
 * REAL router AS one actor, pointed at a route scoped to ANOTHER actor, and checks
 * the guard redirects to the actor's own area instead of rendering the foreign
 * actor's screen (no-cross-persona-route).
 */
export interface PersonaRouteSubject {
  readonly name: string;
  /** The actor the session is signed in as. */
  readonly actor: string;
  /** A freshly-configured router (memory history already pointed at the foreign-actor route). */
  readonly router: (foreignRoute?: string) => AnyRouter;
  /** Every foreign-persona route to sweep. Omit only for a single preconfigured route. */
  readonly foreignRoutes?: readonly string[];
  /** A marker proving the actor landed on its OWN area (the guard redirected). */
  readonly guardMarker: string | RegExp;
  /** The foreign actor's screen content that must NOT render for this actor. */
  readonly foreignMarker: string | RegExp;
}

const present = (marker: string | RegExp): boolean => {
  const text = document.body.textContent ?? '';
  return typeof marker === 'string' ? text.includes(marker) : marker.test(text);
};

/** The React adapter's router-mounted `persona-scoped-visibility` probe. */
export function personaRouterProbe(subject: PersonaRouteSubject): Probe<PersonaExpect> {
  let acted = false;
  const leakedRoutes: string[] = [];
  const unguardedRoutes: string[] = [];
  return {
    async act() {
      const { RouterProvider } = await import('@tanstack/react-router');
      for (const route of subject.foreignRoutes?.length ? subject.foreignRoutes : [undefined]) {
        cleanup();
        render(<RouterProvider router={subject.router(route)} />);
        await settle(80);
        const label = route ?? '(preconfigured route)';
        if (present(subject.foreignMarker)) leakedRoutes.push(label);
        if (!present(subject.guardMarker)) unguardedRoutes.push(label);
      }
      acted = true;
    },
    expect: {
      noForeignAffordance() {
        throw new AvpFail('noForeignAffordance needs a render-as-actor subject; not applicable to a router subject.');
      },
      noCrossPersonaRoute() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (leakedRoutes.length > 0) {
          throw new AvpFail(
            `Signed in as "${subject.actor}", foreign route(s) rendered the opposite persona: ${leakedRoutes.join(', ')}. Guard every route in the persona-fixed build, not only one representative path.`,
            { actor: subject.actor, leakedRoutes },
          );
        }
        if (unguardedRoutes.length > 0) {
          throw new AvpFail(
            `Signed in as "${subject.actor}", foreign route(s) did not redirect to this actor's own area: ${unguardedRoutes.join(', ')}.`,
            { actor: subject.actor, unguardedRoutes },
          );
        }
      },
    },
  };
}

/** True for a router-mounted persona subject (vs the render-as-actor subject). */
export function isPersonaRouteSubject(subject: unknown): subject is PersonaRouteSubject {
  return typeof subject === 'object' && subject !== null && typeof (subject as PersonaRouteSubject).router === 'function';
}
