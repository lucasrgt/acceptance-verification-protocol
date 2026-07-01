import { cleanup, render } from '@testing-library/react';
import { act } from 'react';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { StateCoverageExpect } from '../archetypes/state-coverage';
import type { ReactDesignSubject } from './subject';
import { normColor } from '../design/tokens';
import { settle } from '../adapter-react/settle';

/**
 * The visual signature of the control in the current render: opacity + text colour +
 * whether a spinner is shown. Two states are "visually distinct" iff their signatures
 * differ — the cheap, deterministic proxy for "the state is perceivable".
 */
function signature(): string {
  const el = document.body.querySelector<HTMLElement>('[data-testid="control"]');
  const spinner = document.body.querySelector('[data-testid="spinner"]');
  const opacity = el?.style.opacity || '1';
  const color = el ? normColor(el.style.color) ?? '-' : '-';
  return `${opacity}|${color}|${spinner ? 'spin' : '-'}`;
}

/** The design adapter's `state-coverage` probe — renders default + each state, compares signatures. */
export function stateCoverageProbe(subject: ReactDesignSubject): Probe<StateCoverageExpect> {
  const sig: Record<string, string> = {};
  let acted = false;
  return {
    async act() {
      if (!subject.renderState) throw new AvpFail('state-coverage needs a renderState(state) seam.');
      for (const state of ['default', ...(subject.states ?? [])]) {
        cleanup();
        render(subject.renderState(state));
        await settle();
        sig[state] = signature();
      }
      acted = true;
    },
    expect: {
      statesVisuallyDistinct() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        for (const state of subject.states ?? []) {
          if (sig[state] === sig.default) {
            throw new AvpFail(
              `The "${state}" state renders identically to default (${sig[state]}) — it is set but not painted, so the user can't perceive it. Apply the state's tokens (dim/mute a disabled control, show a spinner for loading).`,
              { state, signature: sig[state], default: sig.default },
            );
          }
        }
      },
    },
  };
}

/** The design adapter's hooks for `state-coverage`. */
export function stateCoverageHooks(subject: ReactDesignSubject): VerifyHooks {
  return { probe: () => stateCoverageProbe(subject) };
}
