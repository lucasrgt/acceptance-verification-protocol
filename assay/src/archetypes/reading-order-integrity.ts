import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `reading-order-integrity` criteria speak; the design adapter implements it. */
export interface ReadingOrderExpect {
  /** The DOM/focus order of the landmark items matches their visual reading order (top→bottom, left→right). */
  domOrderMatchesVisual(): void;
}

/**
 * The `reading-order-integrity` archetype — the geometry tier's accessibility criterion: the
 * order in which elements appear in the DOM (and therefore to a screen reader and to keyboard
 * focus) must match the order in which they are read visually (top to bottom, then left to
 * right). The escape is CSS that reorders elements visually — `order` on a flex child,
 * `column-reverse`, a float, absolute positioning — without moving them in the DOM, so a
 * sighted user and a keyboard/AT user encounter the content in DIFFERENT orders.
 *
 * Distinct from composition-canonical (which checks DOM order against a DECLARED slot spec):
 * here there is no declared order — the VISUAL geometry order is the ground truth and the DOM
 * order must agree with it. Only a real layout engine can measure the visual order, so this
 * lives in the browser tier.
 *
 * Faithfully grounded in Mastodon "Accessibility: Ensure focus order of post elements matches
 * visual reading order" (mastodon:d20d0492) — post header regions reordered with CSS so the
 * focus order diverged from the reading order. Measured via real getBoundingClientRect.
 */
export const readingOrderIntegrity = archetype('reading-order-integrity', '0.1.0', () => {
  criterion(
    'dom-order-matches-visual',
    'The DOM order of the landmark items matches their visual reading order: reading the items top to bottom and (within a row) left to right yields the same sequence as their order in the DOM. CSS that moves an element visually (flex `order`, column-reverse, float, absolute position) without moving it in the DOM is the escape — it desyncs keyboard/screen-reader order from what is seen. Reorder the DOM to match the layout instead of reordering with CSS.',
    { under: 'success', scope: 'invariant', substrate: 'geometry', seenIn: ['mastodon:d20d0492'] },
    mechanical<ReadingOrderExpect>(async ({ act, expect }) => {
      await act();
      expect.domOrderMatchesVisual();
    }),
  );
});
