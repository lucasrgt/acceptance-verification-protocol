import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `layout-shift-integrity` criteria speak; the design adapter implements it. */
export interface LayoutShiftExpect {
  /** Content below async media keeps its position between the loading and loaded states (no layout shift). */
  reservedSpaceStable(): void;
}

/**
 * The `layout-shift-integrity` archetype — the geometry tier's TEMPORAL criterion: content
 * that arrives asynchronously (an image, a recommendation widget, a banner) must reserve its
 * space so the surrounding content does not jump when it loads. The escape is the classic
 * cumulative-layout-shift bug: an unsized image, a late-mounting widget, or an expanding
 * banner pushes everything below it the moment it appears — the reader loses their place and
 * mis-taps. The fix is to reserve the box up front (explicit width/height, aspect-ratio, a
 * fixed-height skeleton).
 *
 * Distinct from every other geometry criterion, which measure a SINGLE static layout: this
 * compares the layout BEFORE and AFTER the content loads (the subject's `loading` vs `loaded`
 * states) and asserts a downstream anchor did not move. Only a real layout engine gives the
 * two positions, so it is browser-measured.
 *
 * Faithfully grounded in the recurrent layout-shift cluster: Mastodon "layout shift caused by
 * 'Who to follow' widget" (mastodon:511e10df), Gitea "button layout shift when collapsing file
 * tree" (gitea:32fdfb0b), Documenso "table layout shift while changing tabs"
 * (documenso:1a23744d). Measured via real getBoundingClientRect across the two states.
 */
export const layoutShiftIntegrity = archetype('layout-shift-integrity', '0.1.0', () => {
  criterion(
    'reserved-space-stable',
    'Async content reserves its space: an element that loads or mounts late (image, widget, banner) does not move the content below it — a downstream anchor keeps the same position between the loading and loaded states. Content that jumps when media arrives is the escape (cumulative layout shift). Reserve the box up front with explicit dimensions, aspect-ratio, or a fixed-height skeleton.',
    { under: 'success', scope: 'invariant', substrate: 'geometry', seenIn: ['mastodon:511e10df', 'gitea:32fdfb0b', 'documenso:1a23744d'] },
    mechanical<LayoutShiftExpect>(async ({ act, expect }) => {
      await act();
      expect.reservedSpaceStable();
    }),
  );
});
