import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `state-coverage` criteria speak; the design adapter implements it. */
export interface StateCoverageExpect {
  /** Each declared interactive state (disabled, loading, …) renders visually distinct from the default — it is perceivable, not silently identical. */
  statesVisuallyDistinct(): void;
}

/**
 * The `state-coverage` archetype — "every interactive state is visually rendered". The
 * runtime, visual sibling of the static state-completeness rule (LZFE010, which checks
 * a loading/empty BRANCH exists): this checks the state actually LOOKS different — a
 * disabled control is dimmed, a loading control shows a spinner. The escape is a state
 * that is set but not painted: the button is `disabled` but looks identical, so the
 * user can't tell.
 *
 * Faithfully grounded: "ui(Button): drive disabled dimming via inline style, not a
 * NativeWind class" (c86c36b3 — the dimming class never applied), "single upload
 * spinner" (f842d42c), and the state-completeness mirror (876f7734). Distinct from the
 * behaviour catalog's blocked-action-is-disabled, which checks the disabled ATTRIBUTE,
 * not whether the state is perceivable.
 */
export const stateCoverage = archetype('state-coverage', '0.1.0', () => {
  criterion(
    'states-visually-distinct',
    'Each declared interactive state (disabled, loading, …) renders visually distinct from the default state — a disabled control is dimmed/muted, a loading control shows a spinner. A state that is set but renders identically to default is the escape: it is not perceivable.',
    { under: 'success', scope: 'invariant', requires: 'states', seenIn: ['c86c36b3', 'f842d42c', '876f7734'] },
    mechanical<StateCoverageExpect>(async ({ act, expect }) => {
      await act();
      expect.statesVisuallyDistinct();
    }),
  );
});
