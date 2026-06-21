import { tokens } from '../../src/design/tokens';

/**
 * Faithful reproduction of the spacing-rhythm escape: nested containers whose padding
 * breaks the rhythm. The user's 4×/2×/1× example — outer roomier than inner, each on
 * the spacing scale. Grounded in "uniform page padding at every breakpoint" (b885222b)
 * and "one padding" (25b16a79). Checks DECLARED padding (inline, jsdom-readable) — the
 * authored rhythm, no layout engine needed.
 *
 * Variants:
 *   good        : depth 0 lg(24) > 1 md(16) > 2 sm(8)
 *   inverted    : inner roomier than outer (8 / 16 / 24)
 *   off-scale   : a middle pad off the spacing scale (13px)
 *   flat        : every depth the same padding (no rhythm)
 *   inconsistent: two depth-1 containers at different padding
 */
export type SpacingVariant = 'good' | 'inverted' | 'off-scale' | 'flat' | 'inconsistent';

function pads(variant: SpacingVariant): { l0: string; l1: string; l2: string; l1b?: string } {
  const good = { l0: tokens.space.lg, l1: tokens.space.md, l2: tokens.space.sm };
  switch (variant) {
    case 'inverted':
      return { l0: tokens.space.sm, l1: tokens.space.md, l2: tokens.space.lg };
    case 'off-scale':
      return { ...good, l1: '13px' };
    case 'flat':
      return { l0: tokens.space.md, l1: tokens.space.md, l2: tokens.space.md };
    case 'inconsistent':
      return { ...good, l1b: tokens.space.lg };
    case 'good':
      return good;
  }
}

function Card({ variant }: { variant: SpacingVariant }) {
  const p = pads(variant);
  return (
    <div data-pad-level="0" style={{ padding: p.l0 }}>
      <div data-pad-level="1" style={{ padding: p.l1 }}>
        <div data-pad-level="2" style={{ padding: p.l2 }}>
          content
        </div>
      </div>
      {p.l1b && (
        <div data-pad-level="1" style={{ padding: p.l1b }}>
          sibling section
        </div>
      )}
    </div>
  );
}

export const buildNestedCard = (variant: SpacingVariant) => () => <Card variant={variant} />;
