import type { Page } from 'puppeteer-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { LayoutShiftExpect } from '../archetypes/layout-shift-integrity';
import type { ReactDesignSubject } from './subject';

/** Read the downstream anchor's top — runs INSIDE the page. Returns NaN if the anchor is missing. */
function measureAnchorTop(): number {
  const el = document.querySelector('[data-anchor]');
  return el ? el.getBoundingClientRect().top : Number.NaN;
}

/** The design adapter's `layout-shift-integrity` probe — compares the anchor's position across loading/loaded. */
export function layoutShiftProbe(subject: ReactDesignSubject, page: Page): Probe<LayoutShiftExpect> {
  let loadingTop = Number.NaN;
  let loadedTop = Number.NaN;
  let acted = false;
  const render = async (state: string): Promise<number> => {
    const html = renderToStaticMarkup(subject.renderState!(state));
    await page.setViewport({ width: 480, height: 640 });
    await page.setContent(`<!doctype html><html><body style="margin:0;font-family:sans-serif">${html}</body></html>`, { waitUntil: 'load' });
    return (await page.evaluate(measureAnchorTop)) as number;
  };
  return {
    async act() {
      if (!subject.renderState) throw new AvpFail('layout-shift-integrity needs a renderState() seam (loading/loaded).');
      loadingTop = await render('loading');
      loadedTop = await render('loaded');
      acted = true;
    },
    expect: {
      reservedSpaceStable() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (Number.isNaN(loadingTop) || Number.isNaN(loadedTop)) {
          throw new AvpFail('No [data-anchor] found in one of the states — mark the content below the async media with data-anchor.');
        }
        const shift = Math.abs(loadedTop - loadingTop);
        if (shift <= 1) return;
        throw new AvpFail(
          `Content shifted ${Math.round(shift)}px when the media loaded — the anchor moved from ${Math.round(loadingTop)}px to ${Math.round(loadedTop)}px. ` +
            `The async content didn't reserve its space, so everything below it jumps. Reserve the box up front (explicit dimensions, aspect-ratio, or a fixed-height skeleton).`,
          { loadingTop, loadedTop, shift },
        );
      },
    },
  };
}

/** The design adapter's hooks for `layout-shift-integrity` (browser-measured, two states). */
export function layoutShiftHooks(subject: ReactDesignSubject, page: Page): VerifyHooks {
  return { probe: () => layoutShiftProbe(subject, page) };
}
