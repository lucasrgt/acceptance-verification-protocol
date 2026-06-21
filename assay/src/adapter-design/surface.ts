import type { Page } from 'puppeteer-core';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AvpFail } from '../core/dsl';
import type { ReactDesignSubject } from './subject';

/**
 * Render a React element to static markup and put it on the page — the one place the
 * geometry tier turns a React surface into a real DOM. Probes that render several surfaces
 * (e.g. layout-shift's loading→loaded states) call this directly per element; the probe
 * owns the viewport.
 */
export async function loadMarkup(page: Page, element: ReactElement): Promise<void> {
  const html = renderToStaticMarkup(element);
  await page.setContent(
    `<!doctype html><html><body style="margin:0;font-family:sans-serif">${html}</body></html>`,
    { waitUntil: 'load' },
  );
}

/**
 * Put a design subject's surface onto a live browser page — the single seam the whole
 * geometry tier shares (every single-surface probe loaded the DOM the same two ways, so
 * it lives here once). Two sources:
 *
 *  - `url`      → navigate to a RUNNING app (the real-app pilot path: the app's own CSS/JS
 *                 produce the real layout — exactly the geometry jsdom can't see).
 *  - `render()` → render a React element to static markup (the bench path: synthetic
 *                 good/bad surfaces whose geometry is carried by inline styles).
 *
 * The probe owns the viewport (it sets it before/around this call); `loadSurface` only
 * puts the DOM on the page. `what` names the archetype for the no-seam error.
 */
export async function loadSurface(page: Page, subject: ReactDesignSubject, what: string): Promise<void> {
  if (subject.url) {
    await page.goto(subject.url, { waitUntil: 'networkidle2' });
    return;
  }
  if (subject.render) {
    await loadMarkup(page, subject.render());
    return;
  }
  throw new AvpFail(`${what} needs a render() or url seam.`);
}
