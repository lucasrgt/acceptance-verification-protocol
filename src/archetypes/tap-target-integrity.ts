import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `tap-target-integrity` criteria speak; the design adapter implements it. */
export interface TapTargetExpect {
  /** Every interactive control is at least the minimum tappable size on both axes. */
  targetsMeetMinimumSize(): void;
}

/** WCAG 2.5.5 (AAA) target size — the conventional 44×44 CSS-px minimum for a reliable tap target. */
export const MIN_TAP_TARGET_PX = 44;

/**
 * The `tap-target-integrity` archetype — the geometry tier's hit-area criterion: every
 * interactive control (button, link, role=button, input) must be at least the minimum
 * tappable size (44×44 CSS px, WCAG 2.5.5) on both axes. The escape is a control too small to
 * reliably tap — a bare icon button with no padding, a thin text link, a back affordance
 * shrunk to its glyph — which fails most on touch and for users with motor impairments.
 *
 * Distinct from the other geometry criteria: it is the control's OWN dimensions against a
 * threshold, not overflow (layout), collision (layer), cross-viewport (responsive), reading
 * order, or mirroring (rtl). The real rendered box is only knowable in a layout engine, so it
 * is browser-measured.
 *
 * Faithfully grounded in the recurrent "clickable area" cluster: Mastodon "Increase clickable
 * area around collection items" (mastodon:2b93a221) and "Widen the clickable area for statuses"
 * (mastodon:a8330be9), and Gitea "Improve clickable area in repo action view" (gitea:8703b6c9)
 * and "Fix size and clickable area on file table back link" (gitea:06eaf74e). Measured via
 * real getBoundingClientRect.
 */
export const tapTargetIntegrity = archetype('tap-target-integrity', '0.1.0', () => {
  criterion(
    'targets-meet-minimum-size',
    `Every interactive control meets the minimum tap-target size: its rendered box is at least ${MIN_TAP_TARGET_PX}×${MIN_TAP_TARGET_PX} CSS px on both axes (WCAG 2.5.5). A bare icon button, a thin link, or a control shrunk to its glyph is the escape — too small to reliably tap on touch or for users with motor impairments. Give the control padding or an explicit min-width/min-height.`,
    { under: 'success', scope: 'invariant', requires: 'geometry', seenIn: ['mastodon:2b93a221', 'mastodon:a8330be9', 'gitea:8703b6c9', 'gitea:06eaf74e'] },
    mechanical<TapTargetExpect>(async ({ act, expect }) => {
      await act();
      expect.targetsMeetMinimumSize();
    }),
  );
});
