/**
 * Faithful reproduction of the layout-integrity escape: content cut off by a fixed box
 * with hidden overflow. Grounded in cal.com's overflow cluster: "Booking Drawer — text
 * overlap in footer" (635c1feb), "availability action btn overflow" (a1124ede), "search
 * bar overlap with title on tablet viewports" (e8e50b70). Measured in a REAL browser —
 * jsdom can't see this (offsetWidth = 0).
 *
 * Variants:
 *   good           : a roomy container, content wraps and fits
 *   clip-horizontal: an 80px container, nowrap long text — cut off on the right
 *   clip-vertical  : a 24px-tall container, text wraps past it — cut off at the bottom
 *   button-clip    : a 60px button, a long label clipped — the btn-overflow escape
 */
export type OverflowVariant = 'good' | 'clip-horizontal' | 'clip-vertical' | 'button-clip';

function Card({ variant }: { variant: OverflowVariant }) {
  switch (variant) {
    case 'clip-horizontal':
      return <div style={{ width: '80px', overflow: 'hidden', whiteSpace: 'nowrap' }}>This is a very long label that will be cut off</div>;
    case 'clip-vertical':
      return <div style={{ width: '120px', height: '24px', overflow: 'hidden' }}>Line one and more text that wraps onto several lines well past the height of this box</div>;
    case 'button-clip':
      return (
        <button style={{ width: '60px', overflow: 'hidden', whiteSpace: 'nowrap' }}>Confirm and continue</button>
      );
    case 'good':
      return <div style={{ width: '200px', overflow: 'hidden', padding: '8px' }}>Short label that wraps fine</div>;
  }
}

export const buildOverflowCard = (variant: OverflowVariant) => () => <Card variant={variant} />;
