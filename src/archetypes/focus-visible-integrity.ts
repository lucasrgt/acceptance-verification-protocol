import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `focus-visible-integrity` criteria speak; the design adapter implements it. */
export interface FocusVisibleExpect {
  /** Every interactive control paints a visible focus indicator when focused. */
  focusIsVisible(): void;
}

/**
 * The `focus-visible-integrity` archetype — the geometry tier's keyboard-a11y criterion: every
 * interactive control must paint a VISIBLE focus indicator when it receives focus (WCAG 2.4.7
 * Focus Visible). The canonical escape is `outline: none` (Tailwind `focus:outline-none`) with no
 * replacement — the UA ring is removed and nothing is added, so a keyboard user has no idea where
 * focus is. Sibling escapes that look fixed but paint nothing: a fully-transparent ring, a
 * zero-width outline, or a focus style mistakenly bound to `:hover` instead of `:focus`.
 *
 * Distinct from the other geometry criteria: tap-target checks the control's SIZE, this checks
 * whether focusing it CHANGES its paint. Distinct from state-coverage (jsdom, declared states are
 * visually distinct) because the focus ring is a real `:focus` style change only a browser
 * resolves — jsdom applies no pseudo-class styles. So it is browser-measured: focus the control,
 * compare its computed outline/box-shadow/border/background before and after.
 *
 * Faithfully grounded in cal.com's focus-ring cluster: "Fixing focus visible" (calcom:7393ba1d1 —
 * the canonical `focus:outline-none` with no ring, fixed by adding `focus:ring-brand-800
 * focus:ring-1`), "align email focus ring with password/username" (calcom:689150d78), and
 * "Wrong focus ring on Help Dropdown" (calcom:c1b41d825).
 */
export const focusVisibleIntegrity = archetype('focus-visible-integrity', '0.1.0', () => {
  criterion(
    'focus-is-visible',
    `Every interactive control paints a visible focus indicator when focused (WCAG 2.4.7): focusing it must change its outline, box-shadow, border, or background to something a sighted keyboard user can actually see. The escape is removing the UA outline (\`outline: none\` / \`focus:outline-none\`) without adding a replacement — or adding one that paints nothing (a transparent ring, a zero-width outline) or that only triggers on \`:hover\`, not \`:focus\`. Add a visible focus ring.`,
    { under: 'success', scope: 'invariant', substrate: 'geometry', seenIn: ['calcom:7393ba1d1', 'calcom:689150d78', 'calcom:c1b41d825'] },
    mechanical<FocusVisibleExpect>(async ({ act, expect }) => {
      await act();
      expect.focusIsVisible();
    }),
  );
});
