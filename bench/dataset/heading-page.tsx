import { tokens } from '../../src/design/tokens';

/**
 * Faithful reproduction of the type-hierarchy escape: visual size not matching the
 * semantic heading level. Grounded in "every screen rides PageContainer + PageHeader —
 * one padding, one type scale" (25b16a79), "the real type scale" (9b609f8c) and "drop
 * redundant per-step headings" (7a2dfc74).
 *
 * A page: title (h1), two sections (h2), a subsection (h3). GOOD follows the type scale
 * monotonically; each mutant breaks the size-vs-level order.
 *
 * Variants:
 *   good                : h1 28 > h2 20 = h2 20 > h3 16
 *   inverted            : h1 16 — the page title smaller than its sections
 *   equal-weight        : h1 20 = h2 20 — title and section compete at one weight
 *   subtitle-beats-title: h3 28 > h1 20 — the subsection louder than the title
 *   inconsistent-h2     : two h2 at 20 and 24 — one level, two sizes
 */
export type HeadingVariant = 'good' | 'inverted' | 'equal-weight' | 'subtitle-beats-title' | 'inconsistent-h2';

interface Sizes {
  h1: string;
  h2a: string;
  h2b: string;
  h3: string;
}

function sizes(variant: HeadingVariant): Sizes {
  const good: Sizes = { h1: tokens.font.xl, h2a: tokens.font.lg, h2b: tokens.font.lg, h3: tokens.font.md };
  switch (variant) {
    case 'inverted':
      return { ...good, h1: tokens.font.md };
    case 'equal-weight':
      return { ...good, h1: tokens.font.lg };
    case 'subtitle-beats-title':
      return { ...good, h1: tokens.font.lg, h3: tokens.font.xl };
    case 'inconsistent-h2':
      return { ...good, h2b: '24px' };
    case 'good':
      return good;
  }
}

function Page({ variant }: { variant: HeadingVariant }) {
  const s = sizes(variant);
  return (
    <div>
      <h1 style={{ fontSize: s.h1 }}>Dashboard</h1>
      <h2 style={{ fontSize: s.h2a }}>Overview</h2>
      <p>some content</p>
      <h2 style={{ fontSize: s.h2b }}>Activity</h2>
      <h3 style={{ fontSize: s.h3 }}>Recent</h3>
    </div>
  );
}

export const buildHeadingPage = (variant: HeadingVariant) => () => <Page variant={variant} />;
