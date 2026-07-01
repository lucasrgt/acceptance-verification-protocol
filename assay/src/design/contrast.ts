import { compositeOver, parseColor } from './color';

/** WCAG 2.1 relative luminance of an sRGB colour. */
function luminance([r, g, b]: readonly [number, number, number]): number {
  const lin = (c: number): number => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Parse a CSS colour to an sRGB triple (alpha dropped), or null if unrecognized. */
export function toRgb(value: string): readonly [number, number, number] | null {
  const p = parseColor(value);
  return p ? [p.r, p.g, p.b] : null;
}

/**
 * WCAG contrast ratio between two colours (1–21). A translucent foreground is
 * composited over the background first — the ratio the eye actually gets, not the
 * ratio of the un-blended ink.
 */
export function contrastRatio(fg: string, bg: string): number | null {
  const f = parseColor(fg);
  const b = parseColor(bg);
  if (!f || !b) return null;
  const solidBg = b.a < 1 ? compositeOver(b, { r: 255, g: 255, b: 255, a: 1 }) : b;
  const solidFg = compositeOver(f, solidBg);
  const l1 = luminance([solidFg.r, solidFg.g, solidFg.b]);
  const l2 = luminance([solidBg.r, solidBg.g, solidBg.b]);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export type ContrastLevel = 'AA' | 'AAA';

/**
 * The WCAG minimum ratio for text of a given size/weight. AA (default): 3:1 large,
 * 4.5:1 normal. AAA: 4.5:1 large, 7:1 normal.
 */
export function aaThreshold(fontSizePx: number, bold: boolean, level: ContrastLevel = 'AA'): number {
  const large = fontSizePx >= 24 || (bold && fontSizePx >= 18.66);
  if (level === 'AAA') return large ? 4.5 : 7;
  return large ? 3 : 4.5;
}
