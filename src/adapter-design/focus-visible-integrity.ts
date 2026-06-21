import type { Page } from 'puppeteer-core';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import { loadSurface } from './surface';
import type { FocusVisibleExpect } from '../archetypes/focus-visible-integrity';
import type { ReactDesignSubject } from './subject';

const INTERACTIVE = 'button, a[href], [role="button"], input:not([type="hidden"]), [tabindex]';

interface Focusable {
  readonly label: string;
  readonly visible: boolean;
}

/**
 * Focus every interactive control and report whether focusing it paints a VISIBLE indicator —
 * runs INSIDE the page. An indicator is a focus-induced CHANGE in paint: an outline/box-shadow/
 * border/background that the focused state shows and the unfocused state does not. A permanent
 * border is not a focus indicator (it doesn't change on focus); a transparent ring or a
 * zero-width outline paints nothing; a `:hover`-only ring never triggers on keyboard focus.
 */
function measureFocus(selector: string): Focusable[] {
  const isTransparent = (c: string): boolean =>
    !c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)' || /,\s*0\)\s*$/.test(c);
  const colors = (s: string): string[] => s.match(/rgba?\([^)]*\)/g) ?? [];
  // A box-shadow paints if it's set and at least one of its colours is not transparent.
  const shadowPaints = (bs: string): boolean => {
    if (bs === 'none' || !bs) return false;
    const cs = colors(bs);
    return cs.length === 0 ? true : cs.some((c) => !isTransparent(c));
  };
  const snap = (el: Element) => {
    const s = getComputedStyle(el);
    return {
      outlinePaints: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 1 && !isTransparent(s.outlineColor),
      boxShadow: s.boxShadow,
      shadowPaints: shadowPaints(s.boxShadow),
      border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}|${s.borderBottomWidth} ${s.borderBottomStyle} ${s.borderBottomColor}`,
      background: s.backgroundColor,
    };
  };
  return Array.from(document.querySelectorAll(selector)).map((el) => {
    const e = el as HTMLElement;
    const label = (e.getAttribute('aria-label') ?? (e.textContent ?? '').trim() ?? '') || e.tagName.toLowerCase();
    e.blur();
    const base = snap(e);
    e.focus();
    const foc = snap(e);
    e.blur();
    const visible =
      (foc.outlinePaints && !base.outlinePaints) ||
      (foc.shadowPaints && foc.boxShadow !== base.boxShadow) ||
      (foc.border !== base.border) ||
      (foc.background !== base.background && !isTransparent(foc.background));
    return { label, visible };
  });
}

/** The design adapter's `focus-visible-integrity` probe — focuses each control in a real browser. */
export function focusVisibleProbe(subject: ReactDesignSubject, page: Page): Probe<FocusVisibleExpect> {
  let controls: Focusable[] = [];
  let acted = false;
  return {
    async act() {
      await page.setViewport({ width: 800, height: 600 });
      await loadSurface(page, subject, 'focus-visible-integrity');
      controls = (await page.evaluate(measureFocus, INTERACTIVE)) as Focusable[];
      acted = true;
    },
    expect: {
      focusIsVisible() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        const blind = controls.filter((c) => !c.visible);
        if (blind.length === 0) return;
        const list = blind.map((c) => `"${c.label}"`).join('; ');
        throw new AvpFail(
          `Interactive controls paint no visible focus indicator when focused (WCAG 2.4.7): ${list}. ` +
            `Removing the UA outline without a replacement — or a transparent/zero-width ring, or a :hover-only ring — leaves keyboard focus invisible. Add a visible focus ring.`,
          { blind },
        );
      },
    },
  };
}

/** The design adapter's hooks for `focus-visible-integrity` (browser-measured). */
export function focusVisibleHooks(subject: ReactDesignSubject, page: Page): VerifyHooks {
  return { probe: () => focusVisibleProbe(subject, page) };
}
