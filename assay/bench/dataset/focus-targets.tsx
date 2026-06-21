/**
 * Faithful reproduction of the focus-visible-integrity escape: an interactive control that paints
 * no visible focus indicator when focused. Grounded in cal.com's focus-ring cluster — "Fixing focus
 * visible" (7393ba1d1: `focus:outline-none` with no replacement ring, fixed by adding
 * `focus:ring-brand-800 focus:ring-1`), "align email focus ring" (689150d78), "Wrong focus ring on
 * Help Dropdown" (c1b41d825). Measured in a REAL browser: jsdom resolves no `:focus` pseudo styles.
 *
 * A toolbar of focusable controls. The focus treatment lives in a `<style>` block (inline styles
 * can't express `:focus`), so the probe sees the real pseudo-class paint. Baseline neutralises the
 * UA outline (`.ctl{outline:none}`) so each variant's `:focus` rule is the only focus paint.
 *
 * Variants (each a distinct way the focus indicator is missing or paints nothing):
 *   good            : `:focus` adds a 2px box-shadow ring — the fix (calcom:7393ba1d1)
 *   no-indicator    : `:focus{outline:none}` and nothing else — the canonical escape
 *   transparent-ring: a ring whose colour is transparent — looks fixed in code, paints nothing
 *   hover-only      : the ring is on `:hover`, not `:focus` — keyboard focus shows nothing
 *   zero-outline    : `:focus{outline:0 solid blue}` — width 0, invisible
 */
export type FocusVariant = 'good' | 'no-indicator' | 'transparent-ring' | 'hover-only' | 'zero-outline';

const BASE = '.ctl{outline:none;border:1px solid #333;background:#fff;color:#111;padding:6px 10px;margin:0}';

const FOCUS: Record<FocusVariant, string> = {
  good: '.ctl:focus{box-shadow:0 0 0 2px #3b82f6}',
  'no-indicator': '.ctl:focus{outline:none}',
  'transparent-ring': '.ctl:focus{outline:none;box-shadow:0 0 0 2px transparent}',
  'hover-only': '.ctl:focus{outline:none}.ctl:hover{box-shadow:0 0 0 2px #3b82f6}',
  'zero-outline': '.ctl:focus{outline:0 solid #3b82f6}',
};

function FocusBar({ variant }: { variant: FocusVariant }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BASE + FOCUS[variant] }} />
      <nav style={{ display: 'flex', gap: '8px' }}>
        <button className="ctl" aria-label="Menu">≡</button>
        <a className="ctl" href="#next">Next</a>
        <button className="ctl" aria-label="Save">OK</button>
      </nav>
    </>
  );
}

export const buildFocusBar = (variant: FocusVariant) => () => <FocusBar variant={variant} />;
