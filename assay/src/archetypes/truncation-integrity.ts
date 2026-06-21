import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `truncation-integrity` criteria speak; the design adapter implements it. */
export interface TruncationExpect {
  /** Every constrained text element that overflows is given a graceful affordance, never a silent spill or hard clip. */
  overflowingTextIsTruncated(): void;
}

/**
 * The `truncation-integrity` archetype — the geometry tier's text-overflow criterion: when text
 * is wider/taller than its constrained box, it must be handled GRACEFULLY — truncated with an
 * ellipsis (`text-overflow: ellipsis`), clamped to N lines (`-webkit-line-clamp`), or made
 * scrollable (`overflow: auto/scroll`). Two escapes: the text SPILLS out of its box (overflow
 * visible) onto neighbouring content, or it is HARD-CLIPPED (overflow hidden) with no ellipsis or
 * clamp, so the user can't tell it was cut.
 *
 * Distinct from `layout-integrity · content-fits`, which flags ANY clipped content unconditionally
 * and is blind to the affordance — it would even fault legitimately-ellipsised text. This criterion
 * is affordance-aware: clipping is CORRECT precisely when an ellipsis/clamp/scroll signals it, and
 * the escape is the missing affordance. The full rendered text width is only knowable in a layout
 * engine, so it is browser-measured.
 *
 * Faithfully grounded in cal.com's truncation cluster: "url truncate properly in the input field on
 * diff screen sizes" (calcom:f63d70552 — a max-width span spilling, fixed by adding
 * `overflow-hidden text-ellipsis whitespace-nowrap`), "app card description truncation"
 * (calcom:22201cbc7 — `overflow:hidden` hard-clip fixed by `line-clamp-3`), and "eventypes
 * description overflow issue" (calcom:3af6fee05 — tall content fixed by `overflow-y-auto`).
 */
export const truncationIntegrity = archetype('truncation-integrity', '0.1.0', () => {
  criterion(
    'overflowing-text-is-truncated',
    `When text overflows its width- or height-constrained container, it must be handled gracefully: truncated with an ellipsis (\`text-overflow: ellipsis\`), clamped to N lines (\`-webkit-line-clamp\`), or made scrollable (\`overflow: auto/scroll\`). The escape is text that SPILLS out of its box (\`overflow: visible\`) over neighbouring content, or that is HARD-CLIPPED (\`overflow: hidden\`) with no ellipsis or clamp so the cut is invisible to the user. Add an ellipsis, a line-clamp, or a scroll affordance.`,
    { under: 'success', scope: 'invariant', substrate: 'geometry', seenIn: ['calcom:f63d70552', 'calcom:22201cbc7', 'calcom:3af6fee05'] },
    mechanical<TruncationExpect>(async ({ act, expect }) => {
      await act();
      expect.overflowingTextIsTruncated();
    }),
  );
});
