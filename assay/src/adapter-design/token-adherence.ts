import { cleanup, render } from '@testing-library/react';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { TokenAdherenceExpect } from '../archetypes/token-adherence';
import type { ReactDesignSubject } from './subject';
import type { DesignOptions } from './verify';
import { buildTokenScale, normColor, tokenScale, type TokenScale } from '../design/tokens';
import { settle } from '../adapter-react/settle';

interface Violation {
  readonly prop: string;
  readonly value: string;
  readonly category: string;
}

/** The style properties we check, each against its token category. */
const CHECKS: ReadonlyArray<{ prop: 'color' | 'backgroundColor' | 'padding' | 'borderRadius' | 'fontSize'; category: keyof TokenScale; color?: boolean }> = [
  { prop: 'color', category: 'color', color: true },
  { prop: 'backgroundColor', category: 'color', color: true },
  { prop: 'padding', category: 'space' },
  { prop: 'borderRadius', category: 'radius' },
  { prop: 'fontSize', category: 'font' },
];

/**
 * Baseline computed values of an unstyled element — a computed value equal to the
 * baseline is an inherited default, not something the surface authored, so it is
 * never checked against the scale.
 */
function computedBaseline(): Record<string, string> {
  const probe = document.createElement('div');
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const base: Record<string, string> = {};
  for (const { prop } of CHECKS) base[prop] = cs[prop as keyof CSSStyleDeclaration] as string;
  probe.remove();
  return base;
}

/** Collect every style value the surface renders that is NOT on the token scale. */
function collectViolations(scale: TokenScale, checkComputed: boolean): Violation[] {
  const out: Violation[] = [];
  const baseline = checkComputed ? computedBaseline() : null;
  for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
    for (const { prop, category, color } of CHECKS) {
      let raw: string = el.style[prop];
      if (!raw && baseline) {
        const computed = getComputedStyle(el)[prop as keyof CSSStyleDeclaration] as string;
        if (computed && computed !== baseline[prop]) raw = computed; // authored via class/stylesheet
      }
      if (!raw) continue; // nothing authored — nothing to check
      const value = color ? normColor(raw) : raw;
      if (value === null) continue;
      const legal = scale[category];
      if (!legal.has(value)) out.push({ prop, value: raw, category });
    }
  }
  return out;
}

/** The design adapter's `token-adherence` probe — checks the surface against the token scale. */
export function tokenAdherenceProbe(subject: ReactDesignSubject, opts: DesignOptions = {}): Probe<TokenAdherenceExpect> {
  const scale = opts.tokens ? buildTokenScale(opts.tokens) : tokenScale;
  let violations: Violation[] = [];
  let acted = false;
  return {
    async act() {
      if (!subject.render) throw new AvpFail('token-adherence needs a render() seam.');
      cleanup();
      render(subject.render());
      await settle();
      violations = collectViolations(scale, opts.checkComputed ?? false);
      acted = true;
    },
    expect: {
      usesTokensOnly() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (violations.length === 0) return;
        const list = violations.map((v) => `${v.prop}="${v.value}" (off the ${v.category} scale)`).join('; ');
        throw new AvpFail(
          `The surface renders ${violations.length} value(s) off the design token scale: ${list}. Use a semantic token — an off-scale value has no theme pair and drifts when the system changes.`,
          { violations },
        );
      },
    },
  };
}

/** The design adapter's hooks for `token-adherence`. */
export function tokenAdherenceHooks(subject: ReactDesignSubject, opts: DesignOptions = {}): VerifyHooks {
  return { probe: () => tokenAdherenceProbe(subject, opts) };
}
