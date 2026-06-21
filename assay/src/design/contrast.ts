import { normColor } from './tokens';

/** WCAG 2.1 relative luminance of an sRGB colour. */
function luminance([r, g, b]: readonly [number, number, number]): number {
  const lin = (c: number): number => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Parse a CSS colour to an sRGB triple, or null if it isn't an rgb/hex colour. */
export function toRgb(value: string): readonly [number, number, number] | null {
  const n = normColor(value);
  if (!n) return null;
  const m = n.match(/^(\d+),(\d+),(\d+)$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** WCAG contrast ratio between two colours (1–21). */
export function contrastRatio(fg: string, bg: string): number | null {
  const a = toRgb(fg);
  const b = toRgb(bg);
  if (!a || !b) return null;
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** The WCAG AA minimum ratio for text of a given size/weight: 3:1 for large, else 4.5:1. */
export function aaThreshold(fontSizePx: number, bold: boolean): number {
  const large = fontSizePx >= 24 || (bold && fontSizePx >= 18.66);
  return large ? 3 : 4.5;
}
