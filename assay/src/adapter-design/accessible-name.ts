import { cleanup, render } from '@testing-library/react';
import { act } from 'react';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { AccessibleNameExpect } from '../archetypes/accessible-name';
import type { ReactDesignSubject } from './subject';

const settle = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

/** The interactive controls that must carry an accessible name. */
const INTERACTIVE =
  'button, a[href], input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="switch"], [role="tab"], [role="menuitem"]';

/** An element is out of the accessibility tree if it (or an ancestor) is aria-hidden or `hidden`. */
function inA11yTree(el: HTMLElement): boolean {
  if (el.closest('[aria-hidden="true"]')) return false;
  for (let n: HTMLElement | null = el; n; n = n.parentElement) if (n.hidden) return false;
  return true;
}

/** Text content of an element, EXCLUDING aria-hidden subtrees and counting alt text of visible images — the name-from-content rule. */
function visibleText(el: Element): string {
  let out = '';
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === 3) {
      out += node.textContent ?? '';
    } else if (node.nodeType === 1) {
      const e = node as HTMLElement;
      if (e.getAttribute('aria-hidden') === 'true') continue;
      out += e.tagName === 'IMG' ? (e.getAttribute('alt') ?? '') : visibleText(e);
    }
  }
  return out;
}

/** Resolve aria-labelledby to the concatenated text of the referenced elements. */
function labelledByText(el: HTMLElement): string {
  const ids = el.getAttribute('aria-labelledby');
  if (!ids) return '';
  return ids
    .split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');
}

/**
 * The accessible name of a control, in (a faithful subset of) accname spec priority:
 * aria-labelledby → aria-label → control-specific (submit value, associated <label>) →
 * name-from-content → title. Placeholder is deliberately NOT a name (axe flags
 * placeholder-only inputs). Returns '' when the control announces nothing.
 */
function accessibleNameOf(el: HTMLElement): string {
  const byId = labelledByText(el).trim();
  if (byId) return byId;
  const aria = (el.getAttribute('aria-label') ?? '').trim();
  if (aria) return aria;

  const tag = el.tagName;
  if (tag === 'INPUT') {
    const type = (el.getAttribute('type') ?? 'text').toLowerCase();
    if (type === 'hidden') return 'hidden'; // not exposed; treated as named so it's never flagged
    if (type === 'submit' || type === 'button' || type === 'reset') {
      const v = (el.getAttribute('value') ?? '').trim();
      if (v) return v;
    }
  }
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
    if (el.id) {
      const forLabel = document.querySelector(`label[for="${el.id}"]`);
      const t = forLabel ? visibleText(forLabel).trim() : '';
      if (t) return t;
    }
    const wrap = el.closest('label');
    if (wrap) {
      const t = visibleText(wrap).trim();
      if (t) return t;
    }
  } else {
    const t = visibleText(el).trim();
    if (t) return t;
  }

  return (el.getAttribute('title') ?? '').trim();
}

/** A short identifier for a control in a failure message. */
function describe(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute('role');
  const type = tag === 'input' ? (el.getAttribute('type') ?? 'text') : '';
  return [tag, type && `[type=${type}]`, role && `[role=${role}]`].filter(Boolean).join('');
}

/** The design adapter's `accessible-name` probe — every interactive control must resolve a non-empty name. */
export function accessibleNameProbe(subject: ReactDesignSubject): Probe<AccessibleNameExpect> {
  let unnamed: HTMLElement[] = [];
  let count = 0;
  let acted = false;
  return {
    async act() {
      if (!subject.render) throw new AvpFail('accessible-name needs a render() seam.');
      cleanup();
      render(subject.render());
      await settle();
      const controls = Array.from(document.body.querySelectorAll<HTMLElement>(INTERACTIVE)).filter(inA11yTree);
      count = controls.length;
      unnamed = controls.filter((el) => accessibleNameOf(el) === '');
      acted = true;
    },
    expect: {
      everyControlNamed() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (unnamed.length) {
          const first = unnamed[0];
          throw new AvpFail(
            `${unnamed.length} of ${count} interactive control(s) have no accessible name — first: <${describe(first)}> with content ${JSON.stringify(
              (first.textContent ?? '').trim().slice(0, 20),
            )}. A screen reader announces its role and nothing else. Give it an aria-label, an associated <label>, or visible (non-aria-hidden) text.`,
            { unnamed: unnamed.map(describe), count },
          );
        }
      },
    },
  };
}

/** The design adapter's hooks for `accessible-name`. */
export function accessibleNameHooks(subject: ReactDesignSubject): VerifyHooks {
  return { probe: () => accessibleNameProbe(subject) };
}
