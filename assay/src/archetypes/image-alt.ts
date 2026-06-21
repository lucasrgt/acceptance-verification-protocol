import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `image-alt` criteria speak; the design adapter implements it. */
export interface ImageAltExpect {
  /** Every informative image exposes a text alternative; decorative images are marked decorative. */
  everyImageHasTextAlternative(): void;
}

/**
 * The `image-alt` archetype — "every image either says what it is or is marked decorative".
 * The #2 most common real-world a11y violation (WebAIM Million: missing alt text on the
 * majority of pages). An `<img>` (or `role="img"`) with no `alt`, no `aria-label`/
 * `aria-labelledby`/`title`, and not marked decorative reaches the accessibility tree as
 * an unnamed graphic — a screen reader announces the filename or nothing. The escape the
 * happy-path test never sees: the image renders fine for a sighted user and passes.
 *
 * The decorative branch is the sharp distinction (and the false-alarm guard): an image
 * deliberately marked decorative — `alt=""`, `aria-hidden="true"`, or
 * `role="presentation"`/`"none"` — is CORRECT and must NOT be flagged. The violation is
 * the absence of a decision (no `alt` attribute at all), not an intentional empty one.
 *
 * Distinct from `accessible-name` (which names INTERACTIVE controls): this names
 * non-interactive informative graphics. The same `dom` substrate — only the accessibility
 * tree, no computed style, no layout.
 *
 * Faithfully grounded: cal.com "Add descriptive alt text to images for accessibility"
 * (fa20f19e), "fix alt text in /apps/typeform" (55113f20), documenso "alt text" (df9c603a).
 */
export const imageAlt = archetype('image-alt', '0.1.0', () => {
  criterion(
    'images-have-text-alternative',
    'Every informative image (`<img>` or `role="img"`) exposes a text alternative — a non-empty `alt`, `aria-label`, `aria-labelledby`, or `title`. An image deliberately marked decorative (`alt=""`, `aria-hidden="true"`, or `role="presentation"`/`"none"`) is correct and is not flagged. The escape is an image with NO text alternative and NO decorative marking: it reaches the accessibility tree unnamed. Add descriptive `alt`, or mark it decorative if it carries no meaning.',
    { under: 'success', scope: 'invariant', substrate: 'dom', requires: 'images', seenIn: ['fa20f19e', '55113f20', 'df9c603a'] },
    mechanical<ImageAltExpect>(async ({ act, expect }) => {
      await act();
      expect.everyImageHasTextAlternative();
    }),
  );
});
