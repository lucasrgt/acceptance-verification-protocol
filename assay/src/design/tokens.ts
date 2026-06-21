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

/**
 * Theme-aware colours — the ground truth for `theme-parity`. A semantic colour resolves
 * to a DIFFERENT value per theme; a value off the ACTIVE theme's scale (a raw palette
 * step, a hard-coded light colour) has no pair there and renders wrong (a light badge in
 * dark mode). The two scales are disjoint on purpose, so a stuck value is unambiguous.
 */
export type DesignTheme = 'light' | 'dark';

export const themes: Record<DesignTheme, { color: Record<string, string> }> = {
  light: { color: { surface: '#ffffff', text: '#1a1a1a', primary: '#2563eb', secondary: '#6b7280', danger: '#dc2626' } },
  dark: { color: { surface: '#111827', text: '#f9fafb', primary: '#60a5fa', secondary: '#9ca3af', danger: '#f87171' } },
};

/** The legal colour set for a given theme (normalised), for theme-parity membership checks. */
export function themeColorScale(theme: DesignTheme): ReadonlySet<string> {
  return new Set(Object.values(themes[theme].color).map((c) => normColor(c)!));
}
