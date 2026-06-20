import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `pagination-integrity` criteria speak; the adapter implements it. */
export interface PaginationExpect {
  /** Paging through the whole list yields every item exactly once — no row dropped at a boundary, none duplicated across pages. */
  pagesCoverTheSet(): void;
}

/**
 * The `pagination-integrity` archetype — "paging through a list yields the whole set,
 * each item exactly once". Distinct from data-honesty's `count-matches-source` (which
 * checks ONE response): this is the multi-page invariant — the UNION of the pages
 * equals the full set, with no off-by-one drop at a page boundary, no overlap that
 * repeats a row, no unstable sort that strands one item on two pages and loses
 * another, and no missing-default-pagination that returns only the first page.
 *
 * A cross-stack escape class (every list app paginates), mined from cal.com (16
 * pagination fixes) and documenso (10): "default pagination on documents list API"
 * (7d257236 — only the first page ever returned), "pagination discrepancy" (0488442),
 * cal.com "apply standard pagination to /bookings" (367e2666). FE-observable and
 * deterministic: drive "next" through the list and compare the collected ids against
 * the full set.
 */
export const paginationIntegrity = archetype('pagination-integrity', '0.1.0', () => {
  criterion(
    'pages-cover-the-set',
    'Paging through the entire list yields every item exactly once: the union of all pages equals the full set — nothing dropped at a page boundary, nothing duplicated across pages, nothing stranded by an unstable sort.',
    { under: 'success', scope: 'invariant', requires: 'paging', seenIn: ['documenso:7d257236', 'documenso:0488442', 'calcom:367e2666'] },
    mechanical<PaginationExpect>(async ({ act, expect }) => {
      await act();
      expect.pagesCoverTheSet();
    }),
  );
});
