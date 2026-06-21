import { cleanup, render } from '@testing-library/react';
import { act } from 'react';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { TokenAdherenceExpect } from '../archetypes/token-adherence';
import type { ReactDesignSubject } from './subject';
import { tokenScale, normColor } from '../design/tokens';

interface Violation {
  readonly prop: string;
  readonly value: string;
  readonly category: string;
}

const settle = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

/** The style properties we check, each against its token category. */
const CHECKS: ReadonlyArray<{ prop: 'color' | 'backgroundColor' | 'padding' | 'borderRadius' | 'fontSize'; category: keyof typeof tokenScale; color?: boolean }> = [
  { prop: 'color', category: 'color', color: true },
  { prop: 'backgroundColor', category: 'color', color: true },
  { prop: 'padding', category: 'space' },
  { prop: 'borderRadius', category: 'radius' },
  { prop: 'fontSize', category: 'font' },
];

/** Collect every inline style value the surface renders that is NOT on the token scale. */
function collectViolations(): Violation[] {
  const out: Violation[] = [];
  for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
    const style = el.style;
    for (const { prop, category, color } of CHECKS) {
      const raw = style[prop];
      if (!raw) continue; // property not set inline — nothing to check
      const value = color ? normColor(raw) : raw;
      if (value === null) continue;
      const legal = tokenScale[category] as ReadonlySet<string>;
      if (!legal.has(value)) out.push({ prop, value: raw, category });
    }
  }
  return out;
}

/** The design adapter's `token-adherence` probe — checks the surface against the token scale. */
export function tokenAdherenceProbe(subject: ReactDesignSubject): Probe<TokenAdherenceExpect> {
  let violations: Violation[] = [];
  let acted = false;
  return {
    async act() {
      if (!subject.render) throw new AvpFail('token-adherence needs a render() seam.');
      cleanup();
      render(subject.render());
      await settle();
      violations = collectViolations();
      acted = true;
    },
    expect: {
      usesTokensOnly() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (violations.length === 0) return;
        const list = violations.map((v) => `${v.prop}="${v.value}" (off the ${v.category} scale)`).join('; ');
        throw new AvpFail(
          `The surface renders ${violations.length} value(s) off the design token scale: ${list}. Use a semantic token (src/design/tokens.ts) — an off-scale value has no theme pair and drifts when the system changes.`,
          { violations },
        );
      },
    },
  };
}

/** The design adapter's hooks for `token-adherence`. */
export function tokenAdherenceHooks(subject: ReactDesignSubject): VerifyHooks {
  return { probe: () => tokenAdherenceProbe(subject) };
}
