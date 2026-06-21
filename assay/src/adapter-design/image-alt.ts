import { cleanup, render } from '@testing-library/react';
import { act } from 'react';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { ImageAltExpect } from '../archetypes/image-alt';
import type { ReactDesignSubject } from './subject';

const settle = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

/** The graphics that must carry a text alternative (or be marked decorative). */
const IMAGES = 'img, [role="img"]';

/** An element is out of the accessibility tree if it (or an ancestor) is aria-hidden or `hidden`. */
function hidden(el: HTMLElement): boolean {
  if (el.closest('[aria-hidden="true"]')) return true;
  for (let n: HTMLElement | null = el; n; n = n.parentElement) if (n.hidden) return true;
  return false;
}

/** Deliberately decorative: an empty alt, role=presentation/none, or hidden from the a11y tree. */
function isDecorative(el: HTMLElement): boolean {
  if (hidden(el)) return true;
  const role = (el.getAttribute('role') ?? '').toLowerCase();
  if (role === 'presentation' || role === 'none') return true;
  // alt="" is the author's explicit "this image is decorative" — present and empty.
  const alt = el.getAttribute('alt');
  if (alt !== null && alt.trim() === '') return true;
  return false;
}

/** The image's text alternative: alt, aria-labelledby, aria-label, or title (first non-empty). */
function textAlternative(el: HTMLElement): string {
  const alt = el.getAttribute('alt');
  if (alt !== null && alt.trim()) return alt.trim();
  const ids = el.getAttribute('aria-labelledby');
  if (ids) {
    const t = ids
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? '')
      .join(' ')
      .trim();
    if (t) return t;
  }
  const label = (el.getAttribute('aria-label') ?? '').trim();
  if (label) return label;
  return (el.getAttribute('title') ?? '').trim();
}

function describe(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const src = el.getAttribute('src');
  return src ? `${tag} src=${JSON.stringify(src.slice(0, 32))}` : tag;
}

/** The design adapter's `image-alt` probe — every informative image must resolve a text alternative. */
export function imageAltProbe(subject: ReactDesignSubject): Probe<ImageAltExpect> {
  let missing: HTMLElement[] = [];
  let count = 0;
  let acted = false;
  return {
    async act() {
      if (!subject.render) throw new AvpFail('image-alt needs a render() seam.');
      cleanup();
      render(subject.render());
      await settle();
      const images = Array.from(document.body.querySelectorAll<HTMLElement>(IMAGES));
      count = images.length;
      // An informative image (not marked decorative) with no text alternative is the escape.
      missing = images.filter((el) => !isDecorative(el) && textAlternative(el) === '');
      acted = true;
    },
    expect: {
      everyImageHasTextAlternative() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (missing.length) {
          const first = missing[0];
          throw new AvpFail(
            `${missing.length} of ${count} image(s) have no text alternative and are not marked decorative — first: <${describe(
              first,
            )}>. A screen reader announces it as an unnamed graphic. Add a descriptive alt/aria-label, or mark it decorative (alt="", aria-hidden, role="presentation") if it carries no meaning.`,
            { missing: missing.map(describe), count },
          );
        }
      },
    },
  };
}

/** The design adapter's hooks for `image-alt`. */
export function imageAltHooks(subject: ReactDesignSubject): VerifyHooks {
  return { probe: () => imageAltProbe(subject) };
}
