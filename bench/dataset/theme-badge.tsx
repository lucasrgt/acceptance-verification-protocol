import { themes, type DesignTheme } from '../../src/design/tokens';

/**
 * Faithful reproduction of the theme-parity escape: a surface that doesn't flip with
 * the theme. Grounded in "badge tones go semantic — the raw palette steps had no dark
 * pair, rendering light badges in dark mode" (dd834c98) and "theme toggle stuck on
 * dark" (67ac3fcd). The adapter renders each variant under BOTH themes; a value off the
 * active theme's scale is the escape.
 *
 * Variants (good resolves colours per theme; each mutant strands a light value in dark):
 *   good           : surface/text/border resolve through the active theme
 *   stuck-bg       : background hard-pinned to the light surface → wrong in dark
 *   stuck-text     : text hard-pinned to the light text → invisible in dark
 *   hardcoded-light: every colour pinned to the light theme → all wrong in dark
 *   raw-step       : a raw palette step (#3b82f6) with no pair in either theme
 */
export type ThemeVariant = 'good' | 'stuck-bg' | 'stuck-text' | 'hardcoded-light' | 'raw-step';

function Badge({ variant, theme }: { variant: ThemeVariant; theme: DesignTheme }) {
  const t = themes[theme].color;
  const light = themes.light.color;
  let style: React.CSSProperties = { backgroundColor: t.surface, color: t.text, borderColor: t.secondary };
  switch (variant) {
    case 'stuck-bg':
      style = { ...style, backgroundColor: light.surface };
      break;
    case 'stuck-text':
      style = { ...style, color: light.text };
      break;
    case 'hardcoded-light':
      style = { backgroundColor: light.surface, color: light.text, borderColor: light.secondary };
      break;
    case 'raw-step':
      style = { ...style, color: '#3b82f6' };
      break;
    case 'good':
      break;
  }
  return (
    <span style={style} data-testid="badge">
      Active
    </span>
  );
}

export const buildThemeBadge = (variant: ThemeVariant) => (theme: DesignTheme) => <Badge variant={variant} theme={theme} />;
