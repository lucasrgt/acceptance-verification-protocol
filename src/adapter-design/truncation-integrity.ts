import type { Page } from 'puppeteer-core';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import { loadSurface } from './surface';
import type { TruncationExpect } from '../archetypes/truncation-integrity';
import type { ReactDesignSubject } from './subject';

interface Offender {
  readonly label: string;
  readonly axis: 'x' | 'y';
  readonly kind: 'spill' | 'hard-clip';
}

/**
 * Find leaf text elements whose text overflows their constrained box with NO graceful affordance —
 * runs INSIDE the page (real layout). For each axis the text overflows on: `overflow: visible` is a
 * spill; `overflow: hidden/clip` with neither `text-overflow: ellipsis` nor a line-clamp is a hard
 * clip. An ellipsis, a line-clamp, or a scrollable overflow (`auto`/`scroll`) is the graceful case
 * and is not reported.
 */
function measureTruncation(): Offender[] {
  const out: Offender[] = [];
  for (const el of Array.from(document.querySelectorAll('*'))) {
    if (el.childElementCount > 0) continue; // only leaf text holders
    if (!(el.textContent ?? '').trim()) continue;
    const overX = el.scrollWidth > el.clientWidth + 1;
    const overY = el.scrollHeight > el.clientHeight + 1;
    if (!overX && !overY) continue;
    const cs = getComputedStyle(el);
    const ellipsis = cs.textOverflow.includes('ellipsis');
    const clampRaw = cs.webkitLineClamp || (cs as unknown as { lineClamp?: string }).lineClamp || 'none';
    const clamp = clampRaw !== 'none' && clampRaw !== '';
    const label = (el.textContent ?? '').trim().slice(0, 24);
    const report = (axis: 'x' | 'y', overflow: string) => {
      if (overflow === 'auto' || overflow === 'scroll') return; // scrollable — graceful
      if (overflow === 'visible') out.push({ label, axis, kind: 'spill' });
      else if (!ellipsis && !clamp) out.push({ label, axis, kind: 'hard-clip' }); // hidden/clip without affordance
    };
    if (overX) report('x', cs.overflowX);
    if (overY) report('y', cs.overflowY);
  }
  return out;
}

/** The design adapter's `truncation-integrity` probe — measures text overflow in a real browser page. */
export function truncationProbe(subject: ReactDesignSubject, page: Page): Probe<TruncationExpect> {
  let offenders: Offender[] = [];
  let acted = false;
  return {
    async act() {
      await page.setViewport({ width: 400, height: 320 });
      await loadSurface(page, subject, 'truncation-integrity');
      offenders = (await page.evaluate(measureTruncation)) as Offender[];
      acted = true;
    },
    expect: {
      overflowingTextIsTruncated() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (offenders.length === 0) return;
        const list = offenders
          .map((o) => `"${o.label}" ${o.kind === 'spill' ? 'spills out of its box' : 'is hard-clipped with no ellipsis'} on ${o.axis}`)
          .join('; ');
        throw new AvpFail(
          `Text overflows its constrained container with no graceful affordance: ${list}. Add a text-overflow ellipsis, a -webkit-line-clamp, or a scrollable overflow — don't let text spill over neighbours or get silently cut.`,
          { offenders },
        );
      },
    },
  };
}

/** The design adapter's hooks for `truncation-integrity` (browser-measured). */
export function truncationHooks(subject: ReactDesignSubject, page: Page): VerifyHooks {
  return { probe: () => truncationProbe(subject, page) };
}
