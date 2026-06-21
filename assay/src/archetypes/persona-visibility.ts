import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `persona-scoped-visibility` criteria speak; the adapter implements it. */
export interface PersonaExpect {
  /** No affordance scoped to a different actor is visible for the rendered actor. */
  noForeignAffordance(): void;
  /** A route scoped to another actor refuses this actor at the guard (redirects to its own area). */
  noCrossPersonaRoute(): void;
}

/**
 * The `persona-scoped-visibility` archetype — "an actor sees only what its role
 * permits". The canonical "test passed, product wrong": the most universal
 * acceptance invariant across marketplaces, SaaS and fintech. The GPT/2nd-Claude
 * reviews flagged it as the transfer hero, and the data agrees — it recurs across
 * independent projects, and the SAME invariant generalizes from PERSONA (a
 * marketplace's traveler/host) to TIER (a SaaS's Free/Pro). See docs/catalog.md #2
 * and the transfer evidence (RQ4).
 */
export const personaVisibility = archetype('persona-scoped-visibility', '0.1.0', () => {
  criterion(
    'no-cross-persona-affordance',
    'Rendered as one actor, no affordance scoped to another actor (or tier) is visible or reachable.',
    { under: 'success', scope: 'invariant', seenIn: ['16c6cd43', '1e6ba089', 'projf:5512811'] },
    mechanical<PersonaExpect>(async ({ act, expect }) => {
      await act();
      expect.noForeignAffordance();
    }),
  );

  criterion(
    'no-cross-persona-route',
    'A route scoped to one actor refuses another actor at the guard: opened as actor X, an actor-Y route redirects X to its own area — it never renders Y\'s screen.',
    { under: 'success', scope: 'invariant', requires: 'router', seenIn: ['documenso:2ba0f48c', 'bitwarden:e4359f071'] },
    mechanical<PersonaExpect>(async ({ act, expect }) => {
      await act();
      expect.noCrossPersonaRoute();
    }),
  );
});
