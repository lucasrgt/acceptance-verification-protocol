import { useState } from 'react';

/**
 * Faithful reproduction of pagination-integrity escapes (`pages-cover-the-set`):
 * paging through a list must yield every item exactly once. Mined from documenso
 * "default pagination on documents list API" (7d257236 — only the first page is
 * returned), "pagination discrepancy" (0488442) and cal.com "apply standard
 * pagination to /bookings" (367e2666).
 *
 * Seven items, page size three → three pages. The page-boundary math is the bug
 * surface; every BAD variant either drops, repeats, strands, or stalls a row.
 *
 * Variants:
 *   good          : slice(p*size, p*size+size)                  → a b c | d e f | g
 *   off-by-one    : slice(p*size+1, …) — 1-indexed offset bug    → drops a, d, g
 *   overlap       : slice(p*size, p*size+size+1) — windows overlap → repeats d, g
 *   first-page-only: ignores the page — default pagination missing → only a b c, repeated
 *   unstable-sort : re-rotates the list each page                → strands one, loses another
 */
export type PagingVariant = 'good' | 'off-by-one' | 'overlap' | 'first-page-only' | 'unstable-sort';

export const ALL_IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const;
const SIZE = 3;
export const PAGE_COUNT = Math.ceil(ALL_IDS.length / SIZE); // 3

function pageItems(variant: PagingVariant, page: number): string[] {
  const all = [...ALL_IDS];
  switch (variant) {
    case 'good':
      return all.slice(page * SIZE, page * SIZE + SIZE);
    case 'off-by-one':
      return all.slice(page * SIZE + 1, page * SIZE + SIZE + 1);
    case 'overlap':
      return all.slice(page * SIZE, page * SIZE + SIZE + 1);
    case 'first-page-only':
      return all.slice(0, SIZE); // the page param is ignored
    case 'unstable-sort': {
      const rotated = [...all.slice(page), ...all.slice(0, page)]; // order shifts per page
      return rotated.slice(page * SIZE, page * SIZE + SIZE);
    }
  }
}

function PagedList({ variant }: { variant: PagingVariant }) {
  const [page, setPage] = useState(0);
  const items = pageItems(variant, page);
  return (
    <div>
      <ul>
        {items.map((id, i) => (
          <li key={`${id}-${i}`} data-testid="paged-item">
            {id}
          </li>
        ))}
      </ul>
      {page < PAGE_COUNT - 1 && (
        <button type="button" onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      )}
    </div>
  );
}

export const buildPagedList = (variant: PagingVariant) => () => <PagedList variant={variant} />;
