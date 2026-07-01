import { cleanup, render } from '@testing-library/react';
import { act } from 'react';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { SpacingRhythmExpect } from '../archetypes/spacing-rhythm';
import type { ReactDesignSubject } from './subject';
import { tokens } from '../design/tokens';
import { settle } from '../adapter-react/settle';

/** Legal padding values (in px) from the spacing scale. */
const SPACE_PX = new Set(Object.values(tokens.space).map((v) => parseFloat(v)));

interface Pad {
  readonly level: number;
  readonly pad: number;
}

/** Read the declared padding (px) of every nesting-marked container (`data-pad-level`). */
function collectPads(): Pad[] {
  const out: Pad[] = [];
  for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('[data-pad-level]'))) {
    const pad = parseFloat(el.style.padding);
    if (Number.isNaN(pad)) continue;
    out.push({ level: Number(el.dataset.padLevel), pad });
  }
  return out;
}

/** The design adapter's `spacing-rhythm` probe — checks the nested-padding rhythm. */
export function spacingRhythmProbe(subject: ReactDesignSubject): Probe<SpacingRhythmExpect> {
  let pads: Pad[] = [];
  let acted = false;
  return {
    async act() {
      if (!subject.render) throw new AvpFail('spacing-rhythm needs a render() seam.');
      cleanup();
      render(subject.render());
      await settle();
      pads = collectPads();
      acted = true;
    },
    expect: {
      rhythmHolds() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        for (const p of pads) {
          if (!SPACE_PX.has(p.pad)) {
            throw new AvpFail(
              `A nested container (depth ${p.level}) has padding ${p.pad}px — off the spacing scale. Use a spacing token.`,
              { pad: p },
            );
          }
        }
        for (let i = 0; i < pads.length; i++) {
          for (let j = 0; j < pads.length; j++) {
            if (i === j) continue;
            const a = pads[i];
            const b = pads[j];
            if (a.level < b.level && a.pad <= b.pad) {
              throw new AvpFail(
                `Inverted spacing rhythm: the container at depth ${a.level} (${a.pad}px) is not roomier than the deeper one at depth ${b.level} (${b.pad}px). Outer containers must breathe more than inner ones.`,
                { a, b },
              );
            }
            if (a.level === b.level && a.pad !== b.pad) {
              throw new AvpFail(
                `Inconsistent spacing at depth ${a.level}: two containers padded ${a.pad}px and ${b.pad}px. One depth, one step of the scale.`,
                { a, b },
              );
            }
          }
        }
      },
    },
  };
}

/** The design adapter's hooks for `spacing-rhythm`. */
export function spacingRhythmHooks(subject: ReactDesignSubject): VerifyHooks {
  return { probe: () => spacingRhythmProbe(subject) };
}
