import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `accessible-name` criteria speak; the design adapter implements it. */
export interface AccessibleNameExpect {
  /** Every interactive control exposes a non-empty accessible name. */
  everyControlNamed(): void;
}

/**
 * The `accessible-name` archetype — "every control announces itself". The single most
 * common real-world a11y escape (axe-core's top finding): an interactive control —
 * an icon-only button, an unlabelled input, an icon link — reaches the accessibility
 * tree with NO accessible name, so a screen reader announces "button" with nothing
 * else, and the control is unusable without sight. The happy-path test clicks it by
 * role+text and never notices the missing name.
 *
 * Distinct from `icon-correctness` (does the glyph fit its MEANING — a model oracle):
 * here the question is purely mechanical and structural — is there a name at all,
 * resolved from the accessibility tree (aria-labelledby / aria-label / associated
 * label / text content excluding aria-hidden / title). It needs only the DOM tree,
 * not computed style or layout — the cheapest design substrate, `dom`.
 *
 * Faithfully grounded in cal.com's accessible-name fixes: "Add aria-label to
 * progressToast close button" (8cace7f7), "added aria-label to timezone input"
 * (a0e4580f), "added aria-label to prev and next month buttons" (bf9be591), "replace
 * title with aria-label to avoid multiple tooltips" (02a86f1d).
 */
export const accessibleName = archetype('accessible-name', '0.1.0', () => {
  criterion(
    'controls-have-accessible-name',
    'Every interactive control (button, link, input, select, textarea, or ARIA-roled widget) that reaches the accessibility tree exposes a non-empty accessible name — from aria-labelledby, aria-label, an associated <label>, its visible text (excluding aria-hidden subtrees), or title. An icon-only control whose only content is an aria-hidden glyph, or an input with only a placeholder, is the escape: a screen reader announces the role and nothing more.',
    { under: 'success', scope: 'invariant', substrate: 'dom', requires: 'interactive', seenIn: ['8cace7f7', 'a0e4580f', 'bf9be591', '02a86f1d'] },
    mechanical<AccessibleNameExpect>(async ({ act, expect }) => {
      await act();
      expect.everyControlNamed();
    }),
  );
});
