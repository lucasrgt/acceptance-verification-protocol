import type { ReactElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { LifecycleGateExpect } from '../archetypes/lifecycle-gate';
import { settle } from './settle';

/**
 * Descriptor of a React `lifecycle-gate` subject — the DOM half of the archetype.
 * Mounts a screen whose precondition is UNMET; the action control must be disabled
 * (and a reason shown), not a live control the user can click into a failure.
 */
export interface ReactLifecycleSubject {
  readonly name: string;
  /** Mounts the screen with the precondition unmet. */
  readonly render: () => ReactElement;
  /** The action that must be disabled while the precondition is unmet. */
  readonly action: { readonly role: string; readonly name: string | RegExp };
  /** The "why it's blocked" text that should accompany the disabled control. */
  readonly reasonMarker?: string | RegExp;
}

const present = (marker: string | RegExp): boolean => {
  const text = document.body.textContent ?? '';
  return typeof marker === 'string' ? text.includes(marker) : marker.test(text);
};

function isDisabled(el: Element): boolean {
  if ((el as HTMLButtonElement).disabled === true) return true;
  return el.getAttribute('aria-disabled') === 'true';
}

/** The React adapter's `lifecycle-gate` probe (the DOM half — blocked-action-is-disabled). */
export function lifecycleFeProbe(subject: ReactLifecycleSubject): Probe<LifecycleGateExpect> {
  let acted = false;
  return {
    async act() {
      cleanup();
      render(subject.render());
      await settle();
      acted = true;
    },
    expect: {
      gateEnforcedServerSide() {
        throw new AvpFail('gateEnforcedServerSide is a backend criterion; not observable in the DOM — use the HTTP adapter.');
      },
      blockedActionIsDisabled() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        const el = screen.queryByRole(subject.action.role, { name: subject.action.name });
        if (!el) {
          throw new AvpFail(
            `The blocked action ("${String(subject.action.name)}") is not present at all — render it disabled with a reason, don't hide it.`,
            {},
          );
        }
        if (!isDisabled(el)) {
          throw new AvpFail(
            `The action ("${String(subject.action.name)}") is live while its precondition is unmet — the FE offers a click that will fail. Disable it (the disabled attribute / aria-disabled), don't rely on the server to bounce it.`,
            {},
          );
        }
        if (subject.reasonMarker && !present(subject.reasonMarker)) {
          throw new AvpFail(
            `The action is disabled but no reason is shown ("${String(subject.reasonMarker)}") — say WHY it's blocked so the user can unblock it.`,
            {},
          );
        }
      },
    },
  };
}

/** The React adapter's hooks for the DOM half of `lifecycle-gate`. */
export function lifecycleFeHooks(subject: ReactLifecycleSubject): VerifyHooks {
  return {
    probe: () => lifecycleFeProbe(subject),
    applies: (c) => (c.requires === 'transition' ? 'React subject — backend criterion not applicable.' : null),
  };
}
