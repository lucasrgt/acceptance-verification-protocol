import { cleanup, render } from '@testing-library/react';
import { act } from 'react';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { ThemeParityExpect } from '../archetypes/theme-parity';
import type { ReactDesignSubject } from './subject';
import { themeColorScale, normColor, type DesignTheme } from '../design/tokens';
import { settle } from '../adapter-react/settle';

const THEMES: readonly DesignTheme[] = ['light', 'dark'];
const COLOR_PROPS = ['color', 'backgroundColor', 'borderColor'] as const;

interface Off {
  readonly theme: DesignTheme;
  readonly prop: string;
  readonly value: string;
}

/** Colours rendered (inline) that are NOT on the given theme's scale. */
function colorsOffScale(scale: ReadonlySet<string>): Array<{ prop: string; value: string }> {
  const out: Array<{ prop: string; value: string }> = [];
  for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
    for (const prop of COLOR_PROPS) {
      const raw = el.style[prop];
      if (!raw) continue;
      const v = normColor(raw);
      if (v === null) continue;
      if (!scale.has(v)) out.push({ prop, value: raw });
    }
  }
  return out;
}

/** The design adapter's `theme-parity` probe — renders under each theme, checks colours against THAT theme's scale. */
export function themeParityProbe(subject: ReactDesignSubject): Probe<ThemeParityExpect> {
  const off: Off[] = [];
  let acted = false;
  return {
    async act() {
      if (!subject.renderTheme) throw new AvpFail('theme-parity needs a renderTheme(theme) seam.');
      for (const theme of THEMES) {
        cleanup();
        render(subject.renderTheme(theme));
        await settle();
        for (const v of colorsOffScale(themeColorScale(theme))) off.push({ theme, ...v });
      }
      acted = true;
    },
    expect: {
      flipsWithTheme() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (off.length === 0) return;
        const list = off.map((v) => `[${v.theme}] ${v.prop}="${v.value}"`).join('; ');
        throw new AvpFail(
          `The surface renders colours off the active theme's scale: ${list}. A value with no pair in that theme renders wrong (a light colour in dark mode). Resolve colours through theme-aware semantic tokens, not raw values.`,
          { off },
        );
      },
    },
  };
}

/** The design adapter's hooks for `theme-parity`. */
export function themeParityHooks(subject: ReactDesignSubject): VerifyHooks {
  return { probe: () => themeParityProbe(subject) };
}
