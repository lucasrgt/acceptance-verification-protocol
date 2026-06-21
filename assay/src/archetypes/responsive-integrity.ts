import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `responsive-integrity` criteria speak; the design adapter implements it. */
export interface ResponsiveIntegrityExpect {
  /** The surface holds at every declared breakpoint — no new horizontal overflow appears as the viewport narrows. */
  holdsAcrossBreakpoints(): void;
}

/**
 * The `responsive-integrity` archetype — the third GEOMETRY criterion and the cross-viewport
 * one: the same surface is swept across several viewport widths and must hold at every one.
 * The escape is the classic "looks fine on desktop, breaks on mobile" — a fixed-width row,
 * an oversized block, or nowrap text that fits wide but pushes the page past a narrow
 * viewport (horizontal scroll on phones/tablets). This is distinct from layout-integrity
 * (one element clipping its OWN content at a single width) and layer-integrity (two
 * elements colliding at a single width): here the SAME markup passes at one breakpoint and
 * fails at another, which only a cross-viewport sweep catches.
 *
 * Faithfully grounded in real responsive fixes: Mastodon "advanced UI columns not using
 * mobile styles" (mastodon:98ec6991) and "vertical videos overflowing the viewport"
 * (mastodon:861625fd), and Gitea "various overflows on actions view" (gitea:b9f69b4a).
 * Measured via real `documentElement.scrollWidth` against the viewport width at each
 * breakpoint, in headless Chrome.
 */
export const responsiveIntegrity = archetype('responsive-integrity', '0.1.0', () => {
  criterion(
    'holds-across-breakpoints',
    'The surface holds across breakpoints: rendered at each declared viewport width, the page never overflows horizontally (documentElement.scrollWidth ≤ viewport width). A surface that fits wide but pushes the page past a narrow viewport — a fixed-width row, an oversized block, or nowrap text that never reflows — is the escape. Let it wrap, cap widths, or add the breakpoint that the mobile layout is missing.',
    { under: 'success', scope: 'invariant', substrate: 'geometry', seenIn: ['mastodon:98ec6991', 'mastodon:861625fd', 'gitea:b9f69b4a'] },
    mechanical<ResponsiveIntegrityExpect>(async ({ act, expect }) => {
      await act();
      expect.holdsAcrossBreakpoints();
    }),
  );
});
