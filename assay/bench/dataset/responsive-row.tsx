/**
 * Faithful reproduction of the responsive-integrity escape: a surface that fits a wide
 * viewport but pushes the page past a narrow one ("looks fine on desktop, breaks on
 * mobile"). Grounded in Mastodon "advanced UI columns not using mobile styles"
 * (98ec6991) and "vertical videos overflowing the viewport" (861625fd), and Gitea
 * "various overflows on actions view" (b9f69b4a). Measured in a REAL browser by sweeping
 * the SAME markup across viewport widths — jsdom can't see this (no layout engine).
 *
 * A toolbar of three column cards that should reflow on small screens.
 *
 * Variants:
 *   good          : the row wraps (flexWrap), so it fits 360 / 768 / 1280 alike
 *   fixed-row     : three fixed 160px columns, nowrap — 480px+ overflows the 360 viewport
 *   wide-block    : a single 900px fixed block — overflows even the 768 tablet viewport
 *   nowrap-heading: a long heading with whiteSpace nowrap — never reflows, overflows narrow
 */
export type ResponsiveVariant = 'good' | 'fixed-row' | 'wide-block' | 'nowrap-heading';

const COLUMNS = ['Inbox', 'Notifications', 'Direct'];

function Toolbar({ variant }: { variant: ResponsiveVariant }) {
  if (variant === 'wide-block') {
    return <div style={{ width: '900px', height: '48px', background: '#eee' }}>Actions log</div>;
  }
  if (variant === 'nowrap-heading') {
    return (
      <h1 style={{ whiteSpace: 'nowrap', fontSize: '28px', margin: 0 }}>
        Your complete advanced interface column configuration overview
      </h1>
    );
  }
  const wrap: React.CSSProperties = variant === 'good' ? { flexWrap: 'wrap' } : { flexWrap: 'nowrap' };
  return (
    <div style={{ display: 'flex', gap: '8px', ...wrap }}>
      {COLUMNS.map((c) => (
        <div key={c} style={{ width: '160px', flex: '0 0 160px', height: '48px', background: '#eee', padding: '8px' }}>
          {c}
        </div>
      ))}
    </div>
  );
}

export const buildResponsiveToolbar = (variant: ResponsiveVariant) => () => <Toolbar variant={variant} />;
