import type { Page } from 'puppeteer-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import { type TapTargetExpect, MIN_TAP_TARGET_PX } from '../archetypes/tap-target-integrity';
import type { ReactDesignSubject } from './subject';

const INTERACTIVE = 'button, a[href], [role="button"], input:not([type="hidden"]), [data-target]';

interface Target {
  readonly label: string;
  readonly w: number;
  readonly h: number;
}

/** Measure every interactive control's rendered box — runs INSIDE the page. */
function measureTargets(selector: string): Target[] {
  return Array.from(document.querySelectorAll(selector)).map((el) => {
    const r = el.getBoundingClientRect();
    const e = el as HTMLElement;
    const label = e.getAttribute('aria-label') ?? (e.textContent ?? '').trim() ?? '';
    return { label: label || e.tagName.toLowerCase(), w: r.width, h: r.height };
  });
}

/** The design adapter's `tap-target-integrity` probe — measures interactive control sizes in a browser page. */
export function tapTargetProbe(subject: ReactDesignSubject, page: Page): Probe<TapTargetExpect> {
  let targets: Target[] = [];
  let acted = false;
  return {
    async act() {
      if (!subject.render) throw new AvpFail('tap-target-integrity needs a render() seam.');
      const html = renderToStaticMarkup(subject.render());
      await page.setViewport({ width: 480, height: 320 });
      await page.setContent(`<!doctype html><html><body style="margin:0;font-family:sans-serif">${html}</body></html>`, { waitUntil: 'load' });
      targets = (await page.evaluate(measureTargets, INTERACTIVE)) as Target[];
      acted = true;
    },
    expect: {
      targetsMeetMinimumSize() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        const tol = 0.5;
        const small = targets.filter((t) => t.w < MIN_TAP_TARGET_PX - tol || t.h < MIN_TAP_TARGET_PX - tol);
        if (small.length === 0) return;
        const list = small.map((t) => `"${t.label}" is ${Math.round(t.w)}×${Math.round(t.h)}px`).join('; ');
        throw new AvpFail(
          `Interactive controls below the ${MIN_TAP_TARGET_PX}×${MIN_TAP_TARGET_PX}px minimum tap-target size: ${list}. Add padding or an explicit min-width/min-height — they are too small to reliably tap.`,
          { small, min: MIN_TAP_TARGET_PX },
        );
      },
    },
  };
}

/** The design adapter's hooks for `tap-target-integrity` (browser-measured). */
export function tapTargetHooks(subject: ReactDesignSubject, page: Page): VerifyHooks {
  return { probe: () => tapTargetProbe(subject, page) };
}
