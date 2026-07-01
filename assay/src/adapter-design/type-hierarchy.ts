import { cleanup, render } from '@testing-library/react';
import { act } from 'react';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { TypeHierarchyExpect } from '../archetypes/type-hierarchy';
import type { ReactDesignSubject } from './subject';
import { settle } from '../adapter-react/settle';

interface Heading {
  readonly level: number;
  readonly size: number;
  readonly text: string;
}

/** Collect rendered headings (h1–h6) with their inline font-size in px. */
function collectHeadings(): Heading[] {
  const out: Heading[] = [];
  for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6'))) {
    const size = parseFloat(el.style.fontSize);
    if (Number.isNaN(size)) continue; // no inline size to compare — skip
    out.push({ level: Number(el.tagName[1]), size, text: (el.textContent ?? '').trim().slice(0, 24) });
  }
  return out;
}

/** The design adapter's `type-hierarchy` probe — checks heading size vs semantic level. */
export function typeHierarchyProbe(subject: ReactDesignSubject): Probe<TypeHierarchyExpect> {
  let headings: Heading[] = [];
  let acted = false;
  return {
    async act() {
      if (!subject.render) throw new AvpFail('type-hierarchy needs a render() seam.');
      cleanup();
      render(subject.render());
      await settle();
      headings = collectHeadings();
      acted = true;
    },
    expect: {
      hierarchyHolds() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        for (let i = 0; i < headings.length; i++) {
          for (let j = 0; j < headings.length; j++) {
            if (i === j) continue;
            const a = headings[i];
            const b = headings[j];
            if (a.level < b.level && a.size <= b.size) {
              throw new AvpFail(
                `Type hierarchy inverted: <h${a.level}> ("${a.text}", ${a.size}px) is more important than <h${b.level}> ("${b.text}", ${b.size}px) but not larger. A higher-level heading must render strictly larger.`,
                { a, b },
              );
            }
            if (a.level === b.level && a.size !== b.size) {
              throw new AvpFail(
                `Same-level headings render at different sizes: two <h${a.level}> at ${a.size}px and ${b.size}px. One level, one size — pick the type scale step for the level.`,
                { a, b },
              );
            }
          }
        }
      },
    },
  };
}

/** The design adapter's hooks for `type-hierarchy`. */
export function typeHierarchyHooks(subject: ReactDesignSubject): VerifyHooks {
  return { probe: () => typeHierarchyProbe(subject) };
}
