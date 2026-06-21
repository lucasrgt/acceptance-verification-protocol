/**
 * Faithful reproduction of the rtl-integrity escape: a direction-dependent icon that fails
 * to mirror under RTL, so it points the wrong way. Grounded in Mastodon "back arrow pointing
 * to the incorrect direction in RTL languages" (51345e51), with the RTL-layout cluster as
 * context (af157939d sidebar, 5e4cc1a39 carousel). Measured in a REAL browser — the
 * `[dir=rtl]` cascade and computed transform need a layout engine (jsdom resolves neither).
 *
 * A nav bar with two directional icons (back, next — marked `data-dir-icon`) and one
 * non-directional icon (search — must never flip). The flip is applied via a real <style>
 * scoped to `[dir="rtl"]`; each variant breaks the scoping a different way.
 *
 * Variants:
 *   good        : `[dir=rtl] [data-dir-icon]{transform:scaleX(-1)}` — both flip under rtl, neither under ltr
 *   no-flip     : no flip rule — back & next stay unmirrored under rtl (the 51345e51 escape)
 *   partial-flip: only `back` flips — `next` stays wrong-way under rtl
 *   flip-always : the flip isn't scoped to rtl — icons mirror under ltr too (wrong)
 *
 * The selectors use UNQUOTED attribute values: React escapes `"` to `&quot;` inside <style>
 * text, which would break a quoted `[dir="rtl"]` selector. Unquoted identifiers are valid CSS.
 */
export type RtlVariant = 'good' | 'no-flip' | 'partial-flip' | 'flip-always';

function css(variant: RtlVariant): string {
  switch (variant) {
    case 'good':
      return '[dir=rtl] [data-dir-icon]{transform:scaleX(-1)}';
    case 'no-flip':
      return '';
    case 'partial-flip':
      return '[dir=rtl] [data-dir-icon=back]{transform:scaleX(-1)}';
    case 'flip-always':
      return '[data-dir-icon]{transform:scaleX(-1)}';
  }
}

function Nav({ variant }: { variant: RtlVariant }) {
  return (
    <>
      <style>{css(variant)}</style>
      <nav style={{ display: 'flex', gap: '12px' }}>
        <span data-dir-icon="back" data-icon="chevron-left">‹</span>
        <span data-dir-icon="next" data-icon="chevron-right">›</span>
        <span data-icon="search">⌕</span>
      </nav>
    </>
  );
}

export const buildRtlNav = (variant: RtlVariant) => () => <Nav variant={variant} />;
