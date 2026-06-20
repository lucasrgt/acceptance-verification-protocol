/**
 * Faithful reproduction of the layout-shift-integrity escape: async content that doesn't
 * reserve its space, so everything below it jumps when it loads (cumulative layout shift).
 * Grounded in the recurrent layout-shift cluster: Mastodon "layout shift caused by 'Who to
 * follow' widget" (511e10df), Gitea "button layout shift when collapsing file tree"
 * (32fdfb0b), Documenso "table layout shift while changing tabs" (1a23744d). Measured in a
 * REAL browser by comparing a downstream anchor's position across two states.
 *
 * A media area above a `[data-anchor]` caption, rendered in `loading` then `loaded` state.
 *
 * Variants:
 *   good            : the media area reserves a fixed 160px box in BOTH states (skeleton →
 *                     image), so the caption never moves
 *   unsized-image   : no media while loading; a 180px image with no reserved box once loaded
 *   late-widget     : a 120px recommendation widget mounts above the caption only when loaded
 *   expanding-banner: a 40px banner that is 0px while loading and 40px once loaded
 */
export type LayoutShiftVariant = 'good' | 'unsized-image' | 'late-widget' | 'expanding-banner';

const LOADED_HEIGHT: Record<Exclude<LayoutShiftVariant, 'good'>, number> = {
  'unsized-image': 180,
  'late-widget': 120,
  'expanding-banner': 40,
};

function mediaHeight(variant: LayoutShiftVariant, state: string): number {
  if (variant === 'good') return 160; // reserved in both states
  return state === 'loaded' ? LOADED_HEIGHT[variant] : 0; // collapses while loading
}

function Card({ variant, state }: { variant: LayoutShiftVariant; state: string }) {
  const h = mediaHeight(variant, state);
  return (
    <div>
      <div data-media style={{ height: `${h}px`, background: '#e6e6e6' }} />
      <p data-anchor style={{ margin: 0 }}>
        Caption that should stay put when the media loads
      </p>
    </div>
  );
}

export const buildLayoutShiftCard = (variant: LayoutShiftVariant) => (state: string) => <Card variant={variant} state={state} />;
