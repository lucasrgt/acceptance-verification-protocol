import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `layout-integrity` criteria speak; the design adapter implements it. */
export interface LayoutIntegrityExpect {
  /** No element clips its own content — nothing is cut off at the edge of a fixed box. */
  contentFits(): void;
}

/**
 * The `layout-integrity` archetype — the first GEOMETRY criterion, measured in a real
 * browser (no jsdom path): content fits its box and isn't cut off. The escape is text
 * or a control clipped by a too-small container with hidden overflow — a label cut off,
 * a button overflowing its row. This is the largest non-Lazuli design class (cal.com:
 * 78 overflow/overlap fixes).
 *
 * Faithfully grounded in cal.com's overflow cluster: "Booking Drawer — text overlap in
 * footer" (635c1feb), "availability action btn overflow" (a1124ede), "search bar overlap
 * with title on tablet viewports" (e8e50b70). Measured via real `scrollWidth`/
 * `clientWidth` in headless Chrome.
 */
export const layoutIntegrity = archetype('layout-integrity', '0.1.0', () => {
  criterion(
    'content-fits',
    'No element clips its own content: for every element whose overflow is hidden/clipped, the content fits the box (scrollWidth ≤ clientWidth, scrollHeight ≤ clientHeight). Content cut off at the edge of a fixed-size container is the escape — give it room, wrap, or truncate with an ellipsis intentionally.',
    { under: 'success', scope: 'invariant', substrate: 'geometry', seenIn: ['calcom:635c1feb', 'calcom:a1124ede', 'calcom:e8e50b70'] },
    mechanical<LayoutIntegrityExpect>(async ({ act, expect }) => {
      await act();
      expect.contentFits();
    }),
  );
});
