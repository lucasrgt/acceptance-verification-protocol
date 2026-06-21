/**
 * Faithful reproduction of the truncation-integrity escape: text overflowing a constrained box with
 * no graceful affordance. Grounded in cal.com's truncation cluster — "url truncate properly in the
 * input field" (f63d70552: a max-width span spilling, fixed by `overflow-hidden text-ellipsis
 * whitespace-nowrap`), "app card description truncation" (22201cbc7: `overflow:hidden` hard-clip
 * fixed by `line-clamp-3`), "eventypes description overflow" (3af6fee05: tall content fixed by
 * `overflow-y-auto`). Measured in a REAL browser: jsdom reports scrollWidth/scrollHeight as 0.
 *
 * A fixed 200×60 card holding a long string. Only the overflow handling varies, so the geometry is
 * identical and the affordance is the only difference.
 *
 * Variants:
 *   good        : nowrap + overflow:hidden + text-overflow:ellipsis — single-line truncation (the f63d70552 fix)
 *   good-clamp  : -webkit-line-clamp:2 — multi-line truncation with ellipsis (the 22201cbc7 fix)
 *   good-scroll : overflow-y:auto on a fixed height — scrollable tall content (the 3af6fee05 fix)
 *   spill-x     : nowrap + overflow:visible — a long URL spills horizontally out of the card
 *   hard-clip-x : nowrap + overflow:hidden, NO ellipsis — cut mid-word, no affordance
 *   clip-y      : fixed height + overflow:hidden, wrapping text, NO line-clamp — lines silently cut
 *   spill-y     : fixed height + overflow:visible — wrapped text spills below the card
 */
export type TruncationVariant =
  | 'good'
  | 'good-clamp'
  | 'good-scroll'
  | 'spill-x'
  | 'hard-clip-x'
  | 'clip-y'
  | 'spill-y';

const URL_TEXT = 'https://app.example.com/teams/engineering/events/quarterly-planning-sync-2026';
const PARA_TEXT =
  'This event brings the whole team together for a long-form planning session covering the roadmap, staffing, and the quarter ahead in considerable detail.';

const base: React.CSSProperties = {
  boxSizing: 'border-box',
  width: '200px',
  height: '60px',
  border: '1px solid #333',
  padding: '4px',
  margin: 0,
  fontSize: '13px',
  lineHeight: '18px',
};

function style(variant: TruncationVariant): React.CSSProperties {
  switch (variant) {
    case 'good':
      return { ...base, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
    case 'good-clamp':
      return { ...base, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
    case 'good-scroll':
      return { ...base, overflowY: 'auto' };
    case 'spill-x':
      return { ...base, whiteSpace: 'nowrap', overflow: 'visible' };
    case 'hard-clip-x':
      return { ...base, whiteSpace: 'nowrap', overflow: 'hidden' };
    case 'clip-y':
      return { ...base, overflow: 'hidden' };
    case 'spill-y':
      return { ...base, overflow: 'visible' };
  }
}

function TruncCard({ variant }: { variant: TruncationVariant }) {
  const singleLine = variant === 'good' || variant === 'spill-x' || variant === 'hard-clip-x';
  return <p style={style(variant)}>{singleLine ? URL_TEXT : PARA_TEXT}</p>;
}

export const buildTruncCard = (variant: TruncationVariant) => () => <TruncCard variant={variant} />;
