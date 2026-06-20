import type { Page } from 'puppeteer-core';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import { loadSurface } from './surface';
import type { RtlIntegrityExpect } from '../archetypes/rtl-integrity';
import type { ReactDesignSubject } from './subject';

interface IconTransform {
  readonly label: string;
  readonly transform: string;
}

/** Read each directional icon (`data-dir-icon`) and its computed transform — runs INSIDE the page. */
function measureDirectionalIcons(): IconTransform[] {
  return Array.from(document.querySelectorAll('[data-dir-icon]')).map((el) => ({
    label: (el as HTMLElement).dataset.dirIcon ?? '',
    transform: getComputedStyle(el).transform,
  }));
}

/** Horizontal scale of a computed transform: `none` → 1, else the first matrix coefficient (negative = mirrored). */
function horizontalScale(transform: string): number {
  if (!transform || transform === 'none') return 1;
  const m = transform.match(/matrix\(([^)]+)\)/);
  if (!m) return 1;
  const a = parseFloat(m[1].split(',')[0]);
  return Number.isFinite(a) ? a : 1;
}

/** The design adapter's `rtl-integrity` probe — reads directional icons' transforms under both writing directions. */
export function rtlProbe(subject: ReactDesignSubject, page: Page): Probe<RtlIntegrityExpect> {
  let ltr: IconTransform[] = [];
  let rtl: IconTransform[] = [];
  let acted = false;
  const readUnder = (dir: 'ltr' | 'rtl') =>
    page.evaluate((d) => {
      document.documentElement.dir = d;
      return Array.from(document.querySelectorAll('[data-dir-icon]')).map((el) => ({
        label: (el as HTMLElement).dataset.dirIcon ?? '',
        transform: getComputedStyle(el).transform,
      }));
    }, dir) as Promise<IconTransform[]>;
  return {
    async act() {
      await page.setViewport({ width: 480, height: 320 });
      await loadSurface(page, subject, 'rtl-integrity');
      ltr = await readUnder('ltr');
      rtl = await readUnder('rtl');
      acted = true;
    },
    expect: {
      directionalIconsMirror() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (rtl.length === 0) {
          throw new AvpFail('No directional icons found ([data-dir-icon]) — nothing to verify for RTL mirroring.');
        }
        for (const icon of rtl) {
          const ltrScale = horizontalScale(ltr.find((i) => i.label === icon.label)?.transform ?? 'none');
          const rtlScale = horizontalScale(icon.transform);
          if (rtlScale >= 0) {
            throw new AvpFail(
              `Directional icon "${icon.label}" is not mirrored under dir=rtl — it points the wrong way in RTL locales. Add a horizontal flip scoped to [dir="rtl"].`,
              { label: icon.label, rtlTransform: icon.transform },
            );
          }
          if (ltrScale < 0) {
            throw new AvpFail(
              `Directional icon "${icon.label}" is mirrored under dir=ltr — it should flip only under RTL. Scope the transform to [dir="rtl"].`,
              { label: icon.label, ltrFlipped: true },
            );
          }
        }
      },
    },
  };
}

/** The design adapter's hooks for `rtl-integrity` (browser-measured, both directions). */
export function rtlHooks(subject: ReactDesignSubject, page: Page): VerifyHooks {
  return { probe: () => rtlProbe(subject, page) };
}
