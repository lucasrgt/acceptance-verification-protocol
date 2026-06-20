/**
 * Faithful reproduction of the tap-target-integrity escape: an interactive control too small
 * to reliably tap. Grounded in the recurrent "clickable area" cluster: Mastodon "Increase
 * clickable area around collection items" (2b93a221), "Widen the clickable area for statuses"
 * (a8330be9), and Gitea "Improve clickable area" (8703b6c9), "size and clickable area on file
 * table back link" (06eaf74e). Measured in a REAL browser via getBoundingClientRect — jsdom
 * reports 0×0.
 *
 * A toolbar of controls. `box-sizing: border-box` makes the declared width/height the rendered
 * box, so the sizes are exact and the UA button padding/border doesn't add noise.
 *
 * Variants (each shrinks one control below the 44px minimum on some axis):
 *   good        : every control is 44×44 — meets the minimum
 *   tiny-icon   : a bare 20×20 icon button (the classic offender)
 *   thin-link   : a back link 60×16 — tall enough to read, too short to tap
 *   narrow-btn  : a 28×44 button — too narrow
 */
export type TapTargetVariant = 'good' | 'tiny-icon' | 'thin-link' | 'narrow-btn';

const box = (w: number, h: number): React.CSSProperties => ({
  boxSizing: 'border-box',
  width: `${w}px`,
  height: `${h}px`,
  padding: 0,
  border: '1px solid #333',
});

function Toolbar({ variant }: { variant: TapTargetVariant }) {
  const icon = variant === 'tiny-icon' ? box(20, 20) : box(44, 44);
  const link = variant === 'thin-link' ? box(60, 16) : box(60, 44);
  const action = variant === 'narrow-btn' ? box(28, 44) : box(44, 44);
  return (
    <nav style={{ display: 'flex', gap: '8px' }}>
      <button aria-label="Menu" style={icon}>≡</button>
      <a href="#back" style={link}>Back</a>
      <button aria-label="Save" style={action}>OK</button>
    </nav>
  );
}

export const buildTapTargetBar = (variant: TapTargetVariant) => () => <Toolbar variant={variant} />;
