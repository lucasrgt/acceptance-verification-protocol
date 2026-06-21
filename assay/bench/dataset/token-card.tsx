import { tokens } from '../../src/design/tokens';

/**
 * Faithful reproduction of the token-adherence escape: a surface that renders a value
 * off the design token scale. Grounded in "badge tones go semantic — the raw palette
 * steps had no dark pair, rendering light badges in dark mode" (dd834c98): a raw
 * palette step (#3b82f6, tailwind blue-500) looks systematic but is NOT the token
 * (primary = #2563eb), so it has no dark pair and drifts.
 *
 * Variants (good uses only tokens; each mutant injects one off-scale value):
 *   good           : every colour/space/radius/font is a token
 *   raw-hex-color  : text colour #3b82f6 — a raw palette step, off the scale
 *   off-scale-bg   : background #eef2ff — off the scale
 *   off-scale-space: padding 13px — off the spacing scale
 *   off-scale-radius: borderRadius 5px — off the radius scale
 *   off-scale-font : fontSize 15px — off the type scale
 */
export type TokenVariant = 'good' | 'raw-hex-color' | 'off-scale-bg' | 'off-scale-space' | 'off-scale-radius' | 'off-scale-font';

function override(variant: TokenVariant): React.CSSProperties {
  switch (variant) {
    case 'raw-hex-color':
      return { color: '#3b82f6' };
    case 'off-scale-bg':
      return { backgroundColor: '#eef2ff' };
    case 'off-scale-space':
      return { padding: '13px' };
    case 'off-scale-radius':
      return { borderRadius: '5px' };
    case 'off-scale-font':
      return { fontSize: '15px' };
    case 'good':
      return {};
  }
}

function Badge({ variant }: { variant: TokenVariant }) {
  const style: React.CSSProperties = {
    color: tokens.color.text,
    backgroundColor: tokens.color.surface,
    padding: tokens.space.sm,
    borderRadius: tokens.radius.md,
    fontSize: tokens.font.sm,
    ...override(variant),
  };
  return (
    <span style={style} data-testid="badge">
      Active
    </span>
  );
}

export const buildTokenCard = (variant: TokenVariant) => () => <Badge variant={variant} />;
