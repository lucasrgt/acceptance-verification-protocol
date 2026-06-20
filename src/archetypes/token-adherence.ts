import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `token-adherence` criteria speak; the design adapter implements it. */
export interface TokenAdherenceExpect {
  /** Every colour/space/radius/font the surface renders is a value from the design token scale — no raw hex, no off-scale literal. */
  usesTokensOnly(): void;
}

/**
 * The `token-adherence` archetype — the #1 design escape: "every colour/space/radius/
 * font on the surface is a semantic token, never a raw palette step or a hard-coded
 * literal". The first design-fidelity criterion (see docs/design-acceptance.md) — same
 * AVP protocol, a new catalog family verified against the DESIGN SYSTEM AS GROUND
 * TRUTH (src/design/tokens.ts). The verifier is the token scale; a value off the scale
 * is the escape.
 *
 * Faithfully grounded: "badge tones go semantic — the raw palette steps had no dark
 * pair, rendering light badges in dark mode" (dd834c98) and "every hex through the
 * token palette" (3988ad19) — a hard-coded value that drifts the moment the theme or
 * the scale changes.
 */
export const tokenAdherence = archetype('token-adherence', '0.1.0', () => {
  criterion(
    'uses-tokens-only',
    'Every colour, spacing, radius and font size the surface renders is a value from the design token scale — no raw hex, no off-scale spacing/radius, no hard-coded font size. A value off the scale has no theme pair and drifts the moment the system changes.',
    { under: 'success', scope: 'invariant', requires: 'tokens', seenIn: ['dd834c98', '3988ad19'] },
    mechanical<TokenAdherenceExpect>(async ({ act, expect }) => {
      await act();
      expect.usesTokensOnly();
    }),
  );
});
