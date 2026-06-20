import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `type-hierarchy` criteria speak; the design adapter implements it. */
export interface TypeHierarchyExpect {
  /** Visual size matches semantic level: a more-important heading renders larger; same level → same size; no inversion. */
  hierarchyHolds(): void;
}

/**
 * The `type-hierarchy` archetype — "the type scale matches the semantic hierarchy".
 * Distinct from token-adherence (which checks each font-size is ON the scale): this
 * checks the ORDERING — a more-important heading (h1) must render larger than a
 * less-important one (h2, h3) that follows, and two headings of the same level render
 * at the same size. The escape is a section title bigger than the page title, two
 * competing titles at the same weight, or one screen mixing type scales.
 *
 * Faithfully grounded: "every screen rides PageContainer + PageHeader — one padding,
 * one type scale" (25b16a79), "the real type scale" / typography parity (9b609f8c),
 * "drop redundant per-step headings (stepper labels them)" (7a2dfc74).
 */
export const typeHierarchy = archetype('type-hierarchy', '0.1.0', () => {
  criterion(
    'hierarchy-holds',
    'Visual type size matches the semantic heading level: a more-important heading (lower level number) renders strictly larger than any less-important heading present, and two headings of the same level render at the same size. No inversion (a section title bigger than the page title), no two titles competing at the same weight.',
    { under: 'success', scope: 'invariant', requires: 'headings', seenIn: ['25b16a79', '9b609f8c', '7a2dfc74'] },
    mechanical<TypeHierarchyExpect>(async ({ act, expect }) => {
      await act();
      expect.hierarchyHolds();
    }),
  );
});
