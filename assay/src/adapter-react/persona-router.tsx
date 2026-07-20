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
  readonly router: () => AnyRouter;
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
  return {
    async act() {
      cleanup();
      const { RouterProvider } = await import('@tanstack/react-router');
      render(<RouterProvider router={subject.router()} />);
      await settle(80);
      acted = true;
    },
    expect: {
      noForeignAffordance() {
        throw new AvpFail('noForeignAffordance needs a render-as-actor subject; not applicable to a router subject.');
      },
      noCrossPersonaRoute() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (present(subject.foreignMarker)) {
          throw new AvpFail(
            `Signed in as "${subject.actor}", an actor-scoped route rendered the foreign actor's screen ("${String(subject.foreignMarker)}") — a cross-persona route leak on a deep link. Guard the route server-confirmed: refuse the wrong actor and redirect to its own area, don't render.`,
            { actor: subject.actor },
          );
        }
        if (!present(subject.guardMarker)) {
          throw new AvpFail(
            `Signed in as "${subject.actor}", the foreign-actor route did not redirect to this actor's own area ("${String(subject.guardMarker)}") — the guard sent it somewhere other than home. Redirect a refused actor to its own area.`,
            { actor: subject.actor },
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
