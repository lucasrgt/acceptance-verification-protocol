import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `layer-integrity` criteria speak; the design adapter implements it. */
export interface LayerIntegrityExpect {
  /** Declared in-flow regions don't visually overlap — nothing sits on top of something it should sit beside/below. */
  noUnintendedOverlap(): void;
}

/**
 * The `layer-integrity` archetype — a GEOMETRY criterion (real browser): two in-flow
 * regions that should stack don't visually overlap. Distinct from layout-integrity
 * (which is an element clipping its OWN content) — this is two SEPARATE elements
 * colliding: a button on top of a textarea, footer text over a control, a dropdown
 * behind the thing it should cover.
 *
 * Faithfully grounded in cal.com's overlap cluster: "onboarding Continue button overlaps
 * Bio textarea on small viewports" (44ccc72f), "prevent textarea resize overlapping
 * buttons in rejection dialog" (794046cf), "Upgradetip text overlapping fixed"
 * (0e900a73). Measured via real `getBoundingClientRect` intersection in headless Chrome.
 */
export const layerIntegrity = archetype('layer-integrity', '0.1.0', () => {
  criterion(
    'no-unintended-overlap',
    'Declared in-flow regions do not visually overlap: the bounding boxes of the regions that should stack/sit beside each other do not intersect. A control sitting on top of another (a button over a textarea, text over a button) — from absolute positioning, a negative margin, or a transform — is the escape.',
    { under: 'success', scope: 'invariant', substrate: 'geometry', seenIn: ['calcom:44ccc72f', 'calcom:794046cf', 'calcom:0e900a73'] },
    mechanical<LayerIntegrityExpect>(async ({ act, expect }) => {
      await act();
      expect.noUnintendedOverlap();
    }),
  );
});
