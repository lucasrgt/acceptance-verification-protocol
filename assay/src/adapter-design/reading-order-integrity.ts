import type { Page } from 'puppeteer-core';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import { loadSurface } from './surface';
import type { ReadingOrderExpect } from '../archetypes/reading-order-integrity';
import type { ReactDesignSubject } from './subject';

interface Item {
  readonly label: string;
  readonly top: number;
  readonly left: number;
}

/** Read each landmark item (`data-order`) in DOM order with its on-screen position — runs INSIDE the page. */
function measureOrderItems(): Item[] {
  return Array.from(document.querySelectorAll('[data-order]')).map((el) => {
    const r = el.getBoundingClientRect();
    return { label: (el as HTMLElement).dataset.order ?? '', top: r.top, left: r.left };
  });
}

/** The visual reading order of the items: top→bottom by row (grouped within a tolerance band), then left→right. */
function visualOrder(items: Item[], band = 8): string[] {
  const byTop = [...items].sort((a, b) => a.top - b.top);
  let rowTop = Number.NEGATIVE_INFINITY;
  let row = -1;
  const rowed = byTop.map((it) => {
    if (it.top > rowTop + band) {
      row += 1;
      rowTop = it.top;
    }
    return { ...it, row };
  });
  return rowed.sort((a, b) => (a.row - b.row) || (a.left - b.left)).map((it) => it.label);
}

/** The design adapter's `reading-order-integrity` probe — compares DOM order to visual order in a browser. */
export function readingOrderProbe(subject: ReactDesignSubject, page: Page): Probe<ReadingOrderExpect> {
  let items: Item[] = [];
  let acted = false;
  return {
    async act() {
      await page.setViewport({ width: 640, height: 480 });
      await loadSurface(page, subject, 'reading-order-integrity');
      items = (await page.evaluate(measureOrderItems)) as Item[];
      acted = true;
    },
    expect: {
      domOrderMatchesVisual() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        const domOrder = items.map((it) => it.label);
        const visual = visualOrder(items);
        const i = domOrder.findIndex((label, idx) => label !== visual[idx]);
        if (i === -1) return;
        throw new AvpFail(
          `DOM/focus order does not match the visual reading order — DOM reads [${domOrder.join(' · ')}] but the layout reads [${visual.join(' · ')}]. ` +
            `"${visual[i]}" is seen at position ${i + 1} but is elsewhere in the DOM, so keyboard/screen-reader order diverges from what is seen. Reorder the DOM to match, not the CSS.`,
          { domOrder, visual },
        );
      },
    },
  };
}

/** The design adapter's hooks for `reading-order-integrity` (browser-measured). */
export function readingOrderHooks(subject: ReactDesignSubject, page: Page): VerifyHooks {
  return { probe: () => readingOrderProbe(subject, page) };
}
