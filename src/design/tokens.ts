/**
 * The design system AS DATA — the ground truth a design verifier checks against.
 * `token-adherence` asks one thing: every colour/space/radius/font a surface renders
 * is a value from THIS scale, never a raw hex or an off-scale literal. Without the
 * scale codified there is nothing to verify against; codifying it is the prerequisite
 * (see docs/design-acceptance.md). A real product swaps this for its own token export.
 */
export const tokens = {
  color: {
    primary: '#2563eb',
    secondary: '#64748b',
    surface: '#ffffff',
    text: '#0f172a',
    muted: '#94a3b8',
    danger: '#dc2626',
  },
  space: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  radius: { sm: '4px', md: '8px', lg: '16px', pill: '9999px' },
  font: { sm: '14px', md: '16px', lg: '20px', xl: '28px' },
} as const;

/** Normalise any CSS colour (hex / rgb / named) to a canonical `r,g,b` (or the name) so jsdom's rgb output and an authored hex compare equal. */
export function normColor(value: string): string | null {
  const s = value.trim().toLowerCase();
  if (!s) return null;
  const rgb = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) return `${+rgb[1]},${+rgb[2]},${+rgb[3]}`;
  const short = s.match(/^#([0-9a-f]{3})$/);
  if (short) {
    const x = short[1];
    return [0, 1, 2].map((i) => parseInt(x[i] + x[i], 16)).join(',');
  }
  const long = s.match(/^#([0-9a-f]{6})$/);
  if (long) {
    const x = long[1];
    return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)).join(',');
  }
  return s; // named colours etc. — compared as-is
}

/** The legal-value sets, by category, for membership checks. Colours are normalised. */
export const tokenScale = {
  color: new Set(Object.values(tokens.color).map((c) => normColor(c)!)),
  space: new Set<string>(Object.values(tokens.space)),
  radius: new Set<string>(Object.values(tokens.radius)),
  font: new Set<string>(Object.values(tokens.font)),
} as const;
