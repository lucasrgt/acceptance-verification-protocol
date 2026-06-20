import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `theme-parity` criteria speak; the design adapter implements it. */
export interface ThemeParityExpect {
  /** In every theme, every colour the surface renders belongs to THAT theme's scale — nothing is stuck or unpaired. */
  flipsWithTheme(): void;
}

/**
 * The `theme-parity` archetype — "every surface flips correctly across themes". The
 * second-largest design escape after token-adherence, and its theme dimension: a value
 * with no pair in the ACTIVE theme (a raw palette step, a hard-coded light colour)
 * renders wrong — the canonical failure is a light badge on a dark surface. The
 * invariant: in each theme, every colour the surface renders is a value from THAT
 * theme's token scale.
 *
 * Faithfully grounded: "badge tones go semantic — the raw palette steps had no dark
 * pair, rendering light badges in dark mode" (dd834c98), "theme toggle stuck on dark"
 * (67ac3fcd), "drive data-theme off the effective theme so light mode flips every
 * surface" (6ac555ae).
 */
export const themeParity = archetype('theme-parity', '0.1.0', () => {
  criterion(
    'flips-with-theme',
    'Across every theme, every colour the surface renders belongs to the ACTIVE theme\'s token scale: a value with no pair in that theme (a raw palette step, a hard-coded light colour in dark mode) is the escape — it renders wrong, like a light badge on a dark surface. Resolve colours through theme-aware semantic tokens, not raw values.',
    { under: 'success', scope: 'invariant', requires: 'theme', seenIn: ['dd834c98', '67ac3fcd', '6ac555ae'] },
    mechanical<ThemeParityExpect>(async ({ act, expect }) => {
      await act();
      expect.flipsWithTheme();
    }),
  );
});
