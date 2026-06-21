import { cleanup, render } from '@testing-library/react';
import { act } from 'react';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { CompositionExpect } from '../archetypes/composition-canonical';
import type { ReactDesignSubject } from './subject';

interface Slot {
  readonly slot: string;
  readonly ds: string;
}

const settle = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

/** Read the rendered landmark slots (`[data-slot]`) in DOM order, with their DS marker (`data-ds`). */
function collectSlots(): Slot[] {
  return Array.from(document.body.querySelectorAll<HTMLElement>('[data-slot]')).map((el) => ({
    slot: el.dataset.slot ?? '',
    ds: el.dataset.ds ?? '',
  }));
}

/** The design adapter's `composition-canonical` probe — checks presence, order, and canonical component. */
export function compositionProbe(subject: ReactDesignSubject): Probe<CompositionExpect> {
  let actual: Slot[] = [];
  let acted = false;
  return {
    async act() {
      if (!subject.render) throw new AvpFail('composition-canonical needs a render() seam.');
      cleanup();
      render(subject.render());
      await settle();
      actual = collectSlots();
      acted = true;
    },
    expect: {
      canonicalComposition() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        const spec = subject.composition ?? [];
        // presence + canonical component
        for (const { slot, component } of spec) {
          const found = actual.find((a) => a.slot === slot);
          if (!found) {
            throw new AvpFail(
              `The "${slot}" slot is missing from the composition — every screen header needs it (e.g. the back affordance, the screen icon, the title).`,
              { spec, actual },
            );
          }
          if (found.ds !== component) {
            throw new AvpFail(
              `The "${slot}" slot is "${found.ds || 'a bespoke element (no data-ds)'}" — expected the canonical <${component}>. Use the design-system component, not a hand-rolled fork.`,
              { slot, expected: component, got: found.ds },
            );
          }
        }
        // order: the declared slots must appear in the declared order in the DOM
        const declared = spec.map((s) => s.slot);
        const domOrder = actual.map((a) => a.slot).filter((s) => declared.includes(s));
        for (let i = 0; i < declared.length; i++) {
          if (domOrder[i] !== declared[i]) {
            throw new AvpFail(
              `Composition out of order: expected [${declared.join(' · ')}] but the DOM renders [${domOrder.join(' · ')}]. The back affordance must come before the title, the icon before the heading, etc.`,
              { declared, domOrder },
            );
          }
        }
      },
    },
  };
}

/** The design adapter's hooks for `composition-canonical`. */
export function compositionHooks(subject: ReactDesignSubject): VerifyHooks {
  return { probe: () => compositionProbe(subject) };
}
