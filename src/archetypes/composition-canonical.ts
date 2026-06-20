import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `composition-canonical` criteria speak; the design adapter implements it. */
export interface CompositionExpect {
  /** The declared landmark slots are all present, in the declared order, each the canonical design-system component (not a bespoke fork). */
  canonicalComposition(): void;
}

/**
 * The `composition-canonical` archetype — atoms/molecules/organisms done right: a
 * screen's landmark slots are the canonical design-system components, composed in the
 * declared structure. The escape is a hand-rolled fork where a DS component exists
 * (one of N tab bars instead of the one `<TabBar>`), a missing slot (no screen icon),
 * or the wrong order (the back affordance below the title instead of above it).
 *
 * Faithfully grounded in the consolidation history: "consolidate hand-rolled tab bars
 * into one `<TabBar>`" (897c6aa0), "consolidate destructive confirm dialogs into one
 * `<ConfirmDialog>`" (2c9376e7), "identidade dos títulos — ícone da tela no page header
 * e cor heading" (c596531b). One canonical component, imported everywhere — repos rot
 * when the same element is built four ways.
 */
export const compositionCanonical = archetype('composition-canonical', '0.1.0', () => {
  criterion(
    'canonical-composition',
    'Every declared landmark slot is present, in the declared order, and is the canonical design-system component — not a hand-rolled fork. The back affordance comes before the title, the screen icon is present, and each slot is the DS component it should be (a bespoke element where a DS one exists is the escape).',
    { under: 'success', scope: 'invariant', requires: 'composition', seenIn: ['897c6aa0', '2c9376e7', 'c596531b'] },
    mechanical<CompositionExpect>(async ({ act, expect }) => {
      await act();
      expect.canonicalComposition();
    }),
  );
});
