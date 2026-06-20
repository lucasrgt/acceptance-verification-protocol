import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `spacing-rhythm` criteria speak; the design adapter implements it. */
export interface SpacingRhythmExpect {
  /** Nested containers' padding is on the spacing scale and follows the nesting rhythm — roomier outside, tighter inside; same depth, same padding. */
  rhythmHolds(): void;
}

/**
 * The `spacing-rhythm` archetype — "nested containers breathe by the scale". The user's
 * 4×/2×/1× example: an outer container is roomier than the one inside it, which is
 * roomier than the one inside that, every step a value from the spacing scale. The
 * escape is an inverted rhythm (inner padding ≥ outer), an off-scale pad, or two
 * containers at the same depth with different padding.
 *
 * NOTE: this checks the *declared* padding of the nested containers (inline styles —
 * jsdom-readable), which IS the authored rhythm; it needs no layout engine. The
 * geometry criteria that DO need a real browser (overflow/overlap/responsive,
 * layout-integrity, layer-integrity) are the separate Playwright tier.
 *
 * Faithfully grounded: "uniform page padding at every breakpoint" (b885222b), "every
 * screen rides PageContainer + PageHeader — one padding" (25b16a79).
 */
export const spacingRhythm = archetype('spacing-rhythm', '0.1.0', () => {
  criterion(
    'rhythm-holds',
    'Nested containers follow the spacing rhythm: each container\'s padding is a value from the spacing scale, a deeper container is never roomier than the one enclosing it (outer ≥ inner, strictly decreasing with depth), and two containers at the same depth share the same padding. An inverted, off-scale, or inconsistent rhythm is the escape.',
    { under: 'success', scope: 'invariant', requires: 'nesting', seenIn: ['b885222b', '25b16a79', 'dc4dd857'] },
    mechanical<SpacingRhythmExpect>(async ({ act, expect }) => {
      await act();
      expect.rhythmHolds();
    }),
  );
});
