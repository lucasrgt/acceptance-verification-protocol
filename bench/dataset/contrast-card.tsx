/**
 * Faithful reproduction of the color-contrast escape: a text/background pair that fails
 * WCAG AA. Grounded in "the raw palette steps had no dark pair, rendering light badges
 * in dark mode" (dd834c98) — a light value on a same-tone surface is a low-contrast,
 * hard-to-read pair. Note good and the mutants can ALL be on-scale colours: a token
 * check passes them, contrast does not.
 *
 * Variants (good is legible; each mutant is a too-low pairing):
 *   good          : near-black on white (~17:1)
 *   low-muted     : muted grey on white (~2.6:1)
 *   light-on-light: light grey on white (~1.2:1)
 *   dark-on-dark  : dark text on a dark surface (~1:1 — invisible, the dd834c98 shape)
 *   danger-low    : a light danger red on white (~2.5:1)
 */
export type ContrastVariant = 'good' | 'low-muted' | 'light-on-light' | 'dark-on-dark' | 'danger-low';

function colors(variant: ContrastVariant): { text: string; bg: string } {
  switch (variant) {
    case 'good':
      return { text: '#1a1a1a', bg: '#ffffff' };
    case 'low-muted':
      return { text: '#9ca3af', bg: '#ffffff' };
    case 'light-on-light':
      return { text: '#e5e7eb', bg: '#ffffff' };
    case 'dark-on-dark':
      return { text: '#111827', bg: '#111827' };
    case 'danger-low':
      return { text: '#f87171', bg: '#ffffff' };
  }
}

function Card({ variant }: { variant: ContrastVariant }) {
  const c = colors(variant);
  return (
    <div style={{ backgroundColor: c.bg }} data-testid="card">
      <span style={{ color: c.text, fontSize: '16px' }}>Readable label</span>
    </div>
  );
}

export const buildContrastCard = (variant: ContrastVariant) => () => <Card variant={variant} />;
