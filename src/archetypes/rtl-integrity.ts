import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `rtl-integrity` criteria speak; the design adapter implements it. */
export interface RtlIntegrityExpect {
  /** Every direction-dependent icon mirrors under `dir=rtl` (and only under rtl), so it points the right way. */
  directionalIconsMirror(): void;
}

/**
 * The `rtl-integrity` archetype — the geometry tier's right-to-left criterion: a
 * direction-dependent icon (a back/forward chevron, a next/previous arrow) must be
 * horizontally mirrored under `dir=rtl`, so it points the correct way in RTL locales — and
 * must NOT be mirrored under `dir=ltr`. The escape is a directional glyph left unflipped
 * under RTL (a "back" arrow still pointing left when it should point right), or flipped
 * unconditionally (wrong under LTR).
 *
 * Distinct from icon-correctness (does the glyph's MEANING fit its label, direction-agnostic):
 * here the glyph is right, but its ORIENTATION under RTL is wrong. Only a real layout engine
 * resolves the `[dir=rtl]` cascade and the computed transform, so this is browser-measured.
 *
 * Faithfully grounded in Mastodon "back arrow pointing to the incorrect direction in RTL
 * languages" (mastodon:51345e51), with the broader RTL-layout cluster as context
 * (mastodon:af157939d sidebar position on RTL, mastodon:5e4cc1a39 carousel on RTL). Measured
 * by reading each directional icon's computed transform under both directions.
 */
export const rtlIntegrity = archetype('rtl-integrity', '0.1.0', () => {
  criterion(
    'directional-icons-mirror',
    'Every direction-dependent icon mirrors correctly with the writing direction: under dir=rtl its computed transform is horizontally flipped (so a back/forward arrow points the right way), and under dir=ltr it is not flipped. A directional icon left unmirrored under RTL — or mirrored unconditionally — is the escape. Scope the horizontal flip to `[dir="rtl"]` and apply it to every directional glyph.',
    { under: 'success', scope: 'invariant', substrate: 'geometry', seenIn: ['mastodon:51345e51', 'mastodon:af157939d'] },
    mechanical<RtlIntegrityExpect>(async ({ act, expect }) => {
      await act();
      expect.directionalIconsMirror();
    }),
  );
});
