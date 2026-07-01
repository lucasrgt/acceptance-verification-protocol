import type { ReactElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { act } from 'react';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { MoneyExpect } from '../archetypes/money-integrity';
import { settle } from './settle';

/**
 * Descriptor of a React `money-integrity` subject — the DISPLAY half
 * (`amount-rendered-exact`). Mounts a surface that shows a money amount; the rendered
 * string must equal the value formatted to the currency's minor units. The value is
 * carried as integer minor units (`amountMinor`) + `precision` — the exact truth — so
 * the probe formats the canonical string itself (integer math, no float) and never
 * trusts the rendering.
 */
export interface ReactMoneySubject {
  readonly name: string;
  /** Mounts the surface showing the amount. */
  readonly render: () => ReactElement;
  /** The amount in integer minor units (e.g. cents): 1050 = 10.50. */
  readonly amountMinor: number;
  /** Minor-unit digits for the currency (default 2). */
  readonly precision?: number;
  /** `data-testid` on the rendered amount node; its textContent holds the displayed amount. */
  readonly amountTestId: string;
}

/** The canonical display of an integer-minor-unit amount, computed without floating point. */
function canonical(amountMinor: number, precision: number): string {
  const neg = amountMinor < 0;
  const abs = Math.abs(amountMinor);
  const div = 10 ** precision;
  const whole = Math.floor(abs / div);
  const frac = String(abs % div).padStart(precision, '0');
  return (neg ? '-' : '') + (precision > 0 ? `${whole}.${frac}` : String(whole));
}

/** The React adapter's `money-integrity` probe (display half — amount-rendered-exact). */
export function moneyDisplayProbe(subject: ReactMoneySubject): Probe<MoneyExpect> {
  let shown: string | null = null;
  return {
    async act() {
      cleanup();
      render(subject.render());
      await settle();
      const el = document.querySelector(`[data-testid="${subject.amountTestId}"]`);
      const text = (el?.textContent ?? '').trim();
      // The numeric token as the user sees it (strip currency symbol/label, keep sign/digits/dot).
      shown = text.match(/-?\d[\d.]*\d|-?\d/)?.[0] ?? null;
    },
    expect: {
      splitInvariant() {
        throw new AvpFail('splitInvariant is a money-at-rest (BE) criterion; not observable in the DOM — use the HTTP adapter.');
      },
      amountRenderedExact() {
        const precision = subject.precision ?? 2;
        const want = canonical(subject.amountMinor, precision);
        if (shown === null) {
          throw new AvpFail(
            `No amount was found at [data-testid="${subject.amountTestId}"] — render the amount so it can be verified (expected ${want}).`,
            { expected: want },
          );
        }
        if (shown !== want) {
          throw new AvpFail(
            `The amount is displayed as "${shown}" but the exact value is "${want}" — a money-display defect (float artifact, dropped/extra decimals, or wrong rounding). Format from the integer minor units (${subject.amountMinor}), never raw float arithmetic.`,
            { shown, expected: want, amountMinor: subject.amountMinor },
          );
        }
      },
    },
  };
}

/** The React adapter's hooks for the display half of `money-integrity`. */
export function moneyDisplayHooks(subject: ReactMoneySubject): VerifyHooks {
  return {
    probe: () => moneyDisplayProbe(subject),
    applies: (c) => (c.requires === 'split' ? 'React subject — the money-at-rest criterion runs on the HTTP adapter.' : null),
  };
}
