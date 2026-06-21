import { cleanup, render } from '@testing-library/react';
import { act } from 'react';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { ColorContrastExpect } from '../archetypes/color-contrast';
import type { ReactDesignSubject } from './subject';
import { contrastRatio, aaThreshold } from '../design/contrast';

const settle = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

/** The effective background of an element: the nearest self-or-ancestor with an inline background, else white. */
function effectiveBg(el: HTMLElement): string {
  let cur: HTMLElement | null = el;
  while (cur) {
    if (cur.style.backgroundColor) return cur.style.backgroundColor;
    cur = cur.parentElement;
  }
  return '#ffffff';
}

interface Fail {
  readonly text: string;
  readonly fg: string;
  readonly bg: string;
  readonly ratio: number;
  readonly need: number;
}

/** Every text-bearing element whose colour fails WCAG AA against its effective background. */
function contrastFailures(): Fail[] {
  const out: Fail[] = [];
  for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
    const fg = el.style.color;
    if (!fg) continue;
    // only leaf-ish text: an element that directly holds visible text
    const ownText = Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent ?? '')
      .join('')
      .trim();
    if (!ownText) continue;
    const bg = effectiveBg(el);
    const ratio = contrastRatio(fg, bg);
    if (ratio === null) continue;
    const size = parseFloat(el.style.fontSize) || 16;
    const bold = el.style.fontWeight === 'bold' || Number(el.style.fontWeight) >= 700;
    const need = aaThreshold(size, bold);
    if (ratio < need) out.push({ text: ownText.slice(0, 24), fg, bg, ratio: Math.round(ratio * 100) / 100, need });
  }
  return out;
}

/** The design adapter's `color-contrast` probe — checks every text/background pair against WCAG AA. */
export function colorContrastProbe(subject: ReactDesignSubject): Probe<ColorContrastExpect> {
  let failures: Fail[] = [];
  let acted = false;
  return {
    async act() {
      if (!subject.render) throw new AvpFail('color-contrast needs a render() seam.');
      cleanup();
      render(subject.render());
      await settle();
      failures = contrastFailures();
      acted = true;
    },
    expect: {
      contrastSufficient() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (failures.length === 0) return;
        const list = failures.map((f) => `"${f.text}" ${f.fg} on ${f.bg} = ${f.ratio}:1 (need ${f.need}:1)`).join('; ');
        throw new AvpFail(
          `Text fails WCAG AA contrast: ${list}. The pairing is hard or impossible to read — darken/lighten the text or its surface so the ratio clears the threshold.`,
          { failures },
        );
      },
    },
  };
}

/** The design adapter's hooks for `color-contrast`. */
export function colorContrastHooks(subject: ReactDesignSubject): VerifyHooks {
  return { probe: () => colorContrastProbe(subject) };
}
