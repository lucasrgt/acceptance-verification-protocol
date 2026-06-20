import type { Page } from 'puppeteer-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { LayerIntegrityExpect } from '../archetypes/layer-integrity';
import type { ReactDesignSubject } from './subject';

interface Rect {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Read the bounding box of every declared region (`data-region`) — runs INSIDE the page. */
function measureRegions(): Rect[] {
  return Array.from(document.querySelectorAll('[data-region]')).map((el) => {
    const r = el.getBoundingClientRect();
    return { name: (el as HTMLElement).dataset.region ?? '', x: r.x, y: r.y, w: r.width, h: r.height };
  });
}

/** Overlap area of two rects on each axis; both > tolerance means a real visual collision. */
function overlaps(a: Rect, b: Rect, tol = 2): boolean {
  const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return ox > tol && oy > tol;
}

/** The design adapter's `layer-integrity` probe — measures region collisions in a browser page. */
export function layerProbe(subject: ReactDesignSubject, page: Page): Probe<LayerIntegrityExpect> {
  let rects: Rect[] = [];
  let acted = false;
  return {
    async act() {
      if (!subject.render) throw new AvpFail('layer-integrity needs a render() seam.');
      const html = renderToStaticMarkup(subject.render());
      await page.setViewport({ width: 360, height: 480 });
      await page.setContent(`<!doctype html><html><body style="margin:0;font-family:sans-serif">${html}</body></html>`, { waitUntil: 'load' });
      rects = (await page.evaluate(measureRegions)) as Rect[];
      acted = true;
    },
    expect: {
      noUnintendedOverlap() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        for (let i = 0; i < rects.length; i++) {
          for (let j = i + 1; j < rects.length; j++) {
            if (overlaps(rects[i], rects[j])) {
              throw new AvpFail(
                `Regions "${rects[i].name}" and "${rects[j].name}" visually overlap — one sits on top of the other instead of stacking. Remove the absolute position / negative margin / transform that collides them.`,
                { a: rects[i], b: rects[j] },
              );
            }
          }
        }
      },
    },
  };
}

/** The design adapter's hooks for `layer-integrity` (browser-measured). */
export function layerHooks(subject: ReactDesignSubject, page: Page): VerifyHooks {
  return { probe: () => layerProbe(subject, page) };
}
