import type { ReactElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { PaginationExpect } from '../archetypes/pagination-integrity';
import { settle } from './settle';

/**
 * Descriptor of a React `pagination-integrity` subject. Mounts a paginated list,
 * drives "next" to the end, and collects the ids rendered on every page. The full
 * set the pages must cover (`expectedIds`) is the acceptance truth — declared as
 * data, so the probe never trusts the rendering to tell it what's complete.
 */
export interface ReactPagingSubject {
  readonly name: string;
  /** Mounts the paginated list (page 1 showing). */
  readonly render: () => ReactElement;
  /** The "next page" control, queried by role + accessible name. */
  readonly next: { readonly role: string; readonly name: string | RegExp };
  /** `data-testid` on each rendered item; the item's textContent is its id. */
  readonly itemTestId: string;
  /** The complete set the pages must cover, each id exactly once. */
  readonly expectedIds: readonly string[];
  /** Safety bound on page traversal (default 50). */
  readonly maxPages?: number;
}

function isDisabled(el: Element): boolean {
  if ((el as HTMLButtonElement).disabled === true) return true;
  return el.getAttribute('aria-disabled') === 'true';
}

/** The React adapter's `pagination-integrity` probe (pages-cover-the-set). */
export function paginationProbe(subject: ReactPagingSubject): Probe<PaginationExpect> {
  const seen: string[] = [];
  return {
    async act() {
      cleanup();
      const user = userEvent.setup();
      render(subject.render());
      await settle();
      const cap = subject.maxPages ?? 50;
      for (let i = 0; i < cap; i++) {
        for (const el of document.querySelectorAll(`[data-testid="${subject.itemTestId}"]`)) {
          seen.push((el.textContent ?? '').trim());
        }
        const next = screen.queryByRole(subject.next.role, { name: subject.next.name });
        if (!next || isDisabled(next)) break;
        await user.click(next);
        await settle();
      }
    },
    expect: {
      pagesCoverTheSet() {
        const counts = new Map<string, number>();
        for (const id of seen) counts.set(id, (counts.get(id) ?? 0) + 1);
        const expected = new Set(subject.expectedIds);
        const duplicated = [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
        const missing = subject.expectedIds.filter((id) => !counts.has(id));
        const extra = [...counts.keys()].filter((id) => !expected.has(id));
        if (missing.length === 0 && duplicated.length === 0 && extra.length === 0) return;
        const parts: string[] = [];
        if (missing.length) parts.push(`dropped ${missing.length} (${missing.join(', ')})`);
        if (duplicated.length) parts.push(`duplicated ${duplicated.length} (${duplicated.join(', ')})`);
        if (extra.length) parts.push(`invented ${extra.length} (${extra.join(', ')})`);
        throw new AvpFail(
          `Paging the list did not cover the set exactly once: ${parts.join('; ')}. ` +
            `Across ${subject.expectedIds.length} expected items the pages must form their exact union — fix the page-boundary math / sort stability / default paging.`,
          { seen, expected: subject.expectedIds, missing, duplicated, extra },
        );
      },
    },
  };
}

/** The React adapter's hooks for `pagination-integrity`. */
export function paginationHooks(subject: ReactPagingSubject): VerifyHooks {
  return {
    probe: () => paginationProbe(subject),
    applies: (c) => (c.requires === 'paging' && !subject.expectedIds ? 'Subject declares no expected set — criterion not applicable.' : null),
  };
}
