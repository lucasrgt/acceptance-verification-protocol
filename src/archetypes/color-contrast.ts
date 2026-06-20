import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `color-contrast` criteria speak; the design adapter implements it. */
export interface ColorContrastExpect {
  /** Every text/background pair meets the WCAG AA contrast minimum — the text is legible. */
  contrastSufficient(): void;
}

/**
 * The `color-contrast` archetype — "text is legible against its background". The
 * runtime half of the a11y-contrast concern the team adopted tooling for (jsx-a11y);
 * the static linter catches authored literals, this catches the COMPUTED pairing —
 * including on-scale-but-low-contrast combinations a token check misses (muted text on
 * a white surface) and theme-dependent failures (a light value on a light surface).
 * Distinct from theme-parity (colours on the active scale): a pair can be perfectly
 * on-scale and still fail WCAG.
 *
 * Faithfully grounded: "the raw palette steps had no dark pair, rendering light badges
 * in dark mode" (dd834c98) — a light badge on a dark surface is a low-contrast pair.
 */
export const colorContrast = archetype('color-contrast', '0.1.0', () => {
  criterion(
    'contrast-sufficient',
    'Every text/background pair meets the WCAG AA contrast minimum (4.5:1 normal text, 3:1 large/bold): the computed ratio of the text colour against its effective background is sufficient. An on-scale but low-contrast pairing (muted text on white) or a theme-stranded value (a light colour on a light surface) is the escape — the text is hard or impossible to read.',
    { under: 'success', scope: 'invariant', requires: 'text', seenIn: ['dd834c98'] },
    mechanical<ColorContrastExpect>(async ({ act, expect }) => {
      await act();
      expect.contrastSufficient();
    }),
  );
});
