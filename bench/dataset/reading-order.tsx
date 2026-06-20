/**
 * Faithful reproduction of the reading-order-integrity escape: elements reordered visually
 * by CSS while staying put in the DOM, so keyboard/screen-reader order diverges from the
 * reading order. Grounded in Mastodon "Accessibility: Ensure focus order of post elements
 * matches visual reading order" (d20d0492) — post header regions (author / handle / time)
 * read in one order visually but came in another order in the DOM. Measured in a REAL
 * browser via getBoundingClientRect — jsdom has no layout to reorder.
 *
 * Three header regions in DOM order author → handle → time.
 *
 * Variants:
 *   good          : laid out left→right author, handle, time — visual order == DOM order
 *   flex-order     : CSS `order` pulls time to the front visually (the d20d0492 mechanism)
 *   column-reverse : column-reverse stacks them bottom-up — visual order is the DOM reversed
 *   absolute-bump  : time is absolutely positioned above author — seen first, last in DOM
 */
export type ReadingOrderVariant = 'good' | 'flex-order' | 'column-reverse' | 'absolute-bump';

function containerStyle(variant: ReadingOrderVariant): React.CSSProperties {
  switch (variant) {
    case 'column-reverse':
      return { display: 'flex', flexDirection: 'column-reverse' };
    case 'absolute-bump':
      return { position: 'relative', display: 'block', paddingTop: '40px' };
    case 'good':
    case 'flex-order':
      return { display: 'flex', flexDirection: 'row', gap: '12px' };
  }
}

function timeStyle(variant: ReadingOrderVariant): React.CSSProperties {
  if (variant === 'flex-order') return { order: -1 };
  if (variant === 'absolute-bump') return { position: 'absolute', top: '0px', left: '0px' };
  return {};
}

function Header({ variant }: { variant: ReadingOrderVariant }) {
  return (
    <div style={containerStyle(variant)}>
      <span data-order="author" style={{ fontWeight: 700 }}>Ada Lovelace</span>
      <span data-order="handle" style={{ color: '#666' }}>@ada</span>
      <span data-order="time" style={timeStyle(variant)}>2h</span>
    </div>
  );
}

export const buildReadingOrderHeader = (variant: ReadingOrderVariant) => () => <Header variant={variant} />;
