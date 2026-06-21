import type { Page } from 'puppeteer-core';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import { loadSurface } from './surface';
import type { ResponsiveIntegrityExpect } from '../archetypes/responsive-integrity';
import type { ReactDesignSubject } from './subject';

/** Mobile / tablet / desktop — the default sweep when a subject declares no breakpoints. */
const DEFAULT_BREAKPOINTS = [360, 768, 1280] as const;

interface BreakpointMeasure {
  readonly width: number;
  readonly scrollWidth: number;
}

/** Read the page's full horizontal extent — runs INSIDE the page after a reflow. */
function measurePageWidth(): number {
  return document.documentElement.scrollWidth;
}

/**
 * The design adapter's `responsive-integrity` probe — sweeps the SAME surface across
 * viewport widths and records the page's horizontal extent at each. Set the content once,
 * then change the viewport per breakpoint so the layout reflows like a real resize.
 */
export function responsiveProbe(subject: ReactDesignSubject, page: Page): Probe<ResponsiveIntegrityExpect> {
  const breakpoints = subject.breakpoints?.length ? subject.breakpoints : DEFAULT_BREAKPOINTS;
  let measures: BreakpointMeasure[] = [];
  let acted = false;
  return {
    async act() {
      await loadSurface(page, subject, 'responsive-integrity');
      const out: BreakpointMeasure[] = [];
      for (const width of breakpoints) {
        await page.setViewport({ width, height: 720 });
        const scrollWidth = (await page.evaluate(measurePageWidth)) as number;
        out.push({ width, scrollWidth });
      }
      measures = out;
      acted = true;
    },
    expect: {
      holdsAcrossBreakpoints() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        const broken = measures.filter((m) => m.scrollWidth > m.width + 1);
        if (broken.length === 0) return;
        const list = broken.map((m) => `${m.width}px viewport → page is ${m.scrollWidth}px wide (overflows by ${m.scrollWidth - m.width}px)`).join('; ');
        throw new AvpFail(
          `The surface overflows horizontally at a breakpoint: ${list}. It fits when wide but pushes the page past a narrow viewport — let it wrap, cap the fixed widths, or add the mobile breakpoint.`,
          { broken },
        );
      },
    },
  };
}

/** The design adapter's hooks for `responsive-integrity` (browser-measured, multi-viewport). */
export function responsiveHooks(subject: ReactDesignSubject, page: Page): VerifyHooks {
  return { probe: () => responsiveProbe(subject, page) };
}
