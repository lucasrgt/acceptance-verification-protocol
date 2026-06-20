import type { Page } from 'puppeteer-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { LayoutIntegrityExpect } from '../archetypes/layout-integrity';
import type { ReactDesignSubject } from './subject';

interface Clip {
  readonly tag: string;
  readonly axis: 'x' | 'y';
  readonly over: number;
}

/** The measurement that runs INSIDE the page (real layout): elements that clip their own content. */
function measureClips(): Clip[] {
  const out: Clip[] = [];
  for (const el of Array.from(document.querySelectorAll('*'))) {
    const cs = getComputedStyle(el);
    const clipX = cs.overflowX === 'hidden' || cs.overflowX === 'clip';
    const clipY = cs.overflowY === 'hidden' || cs.overflowY === 'clip';
    if (clipX && el.scrollWidth > el.clientWidth + 1) out.push({ tag: el.tagName, axis: 'x', over: el.scrollWidth - el.clientWidth });
    if (clipY && el.scrollHeight > el.clientHeight + 1) out.push({ tag: el.tagName, axis: 'y', over: el.scrollHeight - el.clientHeight });
  }
  return out;
}

/** The design adapter's `layout-integrity` probe — measures real geometry in a browser page. */
export function layoutProbe(subject: ReactDesignSubject, page: Page): Probe<LayoutIntegrityExpect> {
  let clips: Clip[] = [];
  let acted = false;
  return {
    async act() {
      if (!subject.render) throw new AvpFail('layout-integrity needs a render() seam.');
      const html = renderToStaticMarkup(subject.render());
      await page.setViewport({ width: 400, height: 320 });
      await page.setContent(`<!doctype html><html><body style="margin:0;font-family:sans-serif">${html}</body></html>`, { waitUntil: 'load' });
      clips = (await page.evaluate(measureClips)) as Clip[];
      acted = true;
    },
    expect: {
      contentFits() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (clips.length === 0) return;
        const list = clips.map((c) => `<${c.tag.toLowerCase()}> clips ${c.over}px on ${c.axis}`).join('; ');
        throw new AvpFail(
          `Content is cut off by a fixed box: ${list}. Give the container room, let it wrap, or truncate intentionally (ellipsis) — don't silently clip the content.`,
          { clips },
        );
      },
    },
  };
}

/** The design adapter's hooks for `layout-integrity` (browser-measured). */
export function layoutHooks(subject: ReactDesignSubject, page: Page): VerifyHooks {
  return { probe: () => layoutProbe(subject, page) };
}
