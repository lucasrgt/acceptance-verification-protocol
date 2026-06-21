import type { ReactElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { act } from 'react';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { PersonaExpect } from '../archetypes/persona-visibility';
import { personaRouterProbe, isPersonaRouteSubject, type PersonaRouteSubject } from './persona-router';

/** A single affordance that belongs to another actor/tier and must not leak. */
export interface ForeignAffordance {
  /** The actor/tier this affordance belongs to (for the failure message). */
  readonly actor: string;
  /** Queried by role + accessible name. */
  readonly role: string;
  readonly name: string | RegExp;
}

/**
 * Descriptor of a `persona-scoped-visibility` subject: render the UI AS one actor,
 * and declare which other actors' affordances must not appear. No action, no API —
 * a pure visibility assertion. Works for personas (traveler/host) and tiers
 * (Free/Pro) alike.
 */
export interface PersonaSubject {
  readonly name: string;
  /** The actor/tier the UI is rendered as. */
  readonly actor: string;
  /** Mounts the component as `actor`. */
  readonly render: () => ReactElement;
  /** Affordances scoped to OTHER actors that must be absent for `actor`. */
  readonly foreignAffordances: readonly ForeignAffordance[];
}

/** The React adapter's `persona-scoped-visibility` probe. */
export function personaProbe(subject: PersonaSubject): Probe<PersonaExpect> {
  let acted = false;
  return {
    async act() {
      cleanup();
      render(subject.render());
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });
      acted = true;
    },
    expect: {
      noForeignAffordance() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        const leaks = subject.foreignAffordances.filter((a) => isAffordancePresent(a));
        if (leaks.length > 0) {
          const l = leaks[0];
          throw new AvpFail(
            `Rendered as "${subject.actor}", an affordance scoped to "${l.actor}" is visible ("${String(l.name)}"). Scope it to its actor — ${subject.actor} must never see ${l.actor}'s controls or data.`,
            { actor: subject.actor, leaked: leaks.map((x) => ({ actor: x.actor, name: String(x.name) })) },
          );
        }
      },
      noCrossPersonaRoute() {
        throw new AvpFail('noCrossPersonaRoute needs a router-mounted subject (declare `router`); not applicable to a render-as-actor subject.');
      },
    },
  };
}

/**
 * The interactive roles a control can wear. An affordance leak counts whether it's
 * a button, a link, a tab or a menu item — the same "switch to host" control must
 * be caught by what it IS, not only by the one role the subject happened to declare.
 */
const INTERACTIVE_ROLES = ['button', 'link', 'tab', 'menuitem', 'option'] as const;

/** Present iff the declared role matches, OR any interactive role carries the same accessible name. */
function isAffordancePresent(a: ForeignAffordance): boolean {
  if (screen.queryByRole(a.role, { name: a.name }) !== null) return true;
  return INTERACTIVE_ROLES.some((role) => screen.queryByRole(role, { name: a.name }) !== null);
}

/**
 * The React adapter's hooks for `persona-scoped-visibility`. Dispatches by subject
 * shape: a render-as-actor subject runs `no-cross-persona-affordance`; a
 * router-mounted subject runs `no-cross-persona-route`. Each criterion is gated to
 * the subject that can observe it.
 */
export function personaHooks(subject: PersonaSubject | PersonaRouteSubject): VerifyHooks {
  const isRoute = isPersonaRouteSubject(subject);
  return {
    probe: () => (isRoute ? personaRouterProbe(subject) : personaProbe(subject as PersonaSubject)),
    applies: (c) => {
      if (c.id === 'no-cross-persona-route' && !isRoute) return 'Render-as-actor subject — route criterion not applicable.';
      if (c.id === 'no-cross-persona-affordance' && isRoute) return 'Router subject — affordance criterion not applicable.';
      return null;
    },
  };
}
