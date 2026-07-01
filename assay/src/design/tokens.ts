import { parseColor } from './color';

/**
 * The design system AS DATA — the ground truth a design verifier checks against.
 * `token-adherence` asks one thing: every colour/space/radius/font a surface renders
 * is a value from THIS scale, never a raw hex or an off-scale literal. Without the
 * scale codified there is nothing to verify against; codifying it is the prerequisite
 * (see docs/design-acceptance.md).
 *
 * A real product brings its OWN export: pass `tokens`/`themes` in the DesignOptions of
 * verifyDesign() (see buildTokenScale/buildThemeScale) — the values below are the demo
 * system the bench calibrates against, not a requirement.
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

/** The shape a product's token export must provide to swap the ground truth. */
export interface TokenSource {
  readonly color: Readonly<Record<string, string>>;
  readonly space: Readonly<Record<string, string>>;
  readonly radius: Readonly<Record<string, string>>;
  readonly font: Readonly<Record<string, string>>;
}

/**
 * Normalise any CSS colour (hex / rgb[a] / hsl[a] / oklch / named) to a canonical
 * `r,g,b` string so jsdom's rgb output and an authored value compare equal. Alpha is
 * dropped here on purpose — token membership is about the hue, compositing is the
 * contrast checker's job. Unrecognized notations compare as-is.
 */
export function normColor(value: string): string | null {
  const s = value.trim().toLowerCase();
  if (!s) return null;
  const parsed = parseColor(s);
  if (parsed) return `${parsed.r},${parsed.g},${parsed.b}`;
  return s; // unknown notation — compared as-is
}

export interface TokenScale {
  readonly color: ReadonlySet<string>;
  readonly space: ReadonlySet<string>;
  readonly radius: ReadonlySet<string>;
  readonly font: ReadonlySet<string>;
}

/** Builds the legal-value sets for membership checks from any token export (colours normalised). */
export function buildTokenScale(source: TokenSource): TokenScale {
  return {
    color: new Set(Object.values(source.color).map((c) => normColor(c)!)),
    space: new Set<string>(Object.values(source.space)),
    radius: new Set<string>(Object.values(source.radius)),
    font: new Set<string>(Object.values(source.font)),
  };
}

/** The legal-value sets for the demo system — the default when DesignOptions carries no tokens. */
export const tokenScale: TokenScale = buildTokenScale(tokens);

/**
 * Theme-aware colours — the ground truth for `theme-parity`. A semantic colour resolves
 * to a DIFFERENT value per theme; a value off the ACTIVE theme's scale (a raw palette
 * step, a hard-coded light colour) has no pair there and renders wrong (a light badge in
 * dark mode). The two scales are disjoint on purpose, so a stuck value is unambiguous.
 */
export type DesignTheme = 'light' | 'dark';

export type ThemeSource = Record<DesignTheme, { readonly color: Readonly<Record<string, string>> }>;

export const themes: ThemeSource = {
  light: { color: { surface: '#ffffff', text: '#1a1a1a', primary: '#2563eb', secondary: '#6b7280', danger: '#dc2626' } },
  dark: { color: { surface: '#111827', text: '#f9fafb', primary: '#60a5fa', secondary: '#9ca3af', danger: '#f87171' } },
};

/** The legal colour set for a given theme (normalised), for theme-parity membership checks. */
export function themeColorScale(theme: DesignTheme, source: ThemeSource = themes): ReadonlySet<string> {
  return new Set(Object.values(source[theme].color).map((c) => normColor(c)!));
}
