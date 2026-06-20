import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { paginationIntegrity } from '../src/archetypes/pagination-integrity';
import type { ReactPagingSubject } from '../src/adapter-react/pagination-integrity';
import { buildPagedList, ALL_IDS, type PagingVariant } from './dataset/paged-list';

/**
 * pagination-integrity · pages-cover-the-set — paging through a list must yield every
 * item exactly once. Distinct from data-honesty's count-matches-source (one response):
 * this is the multi-page union invariant. Faithful escapes: documenso "default
 * pagination on documents list API" (7d257236), "pagination discrepancy" (0488442);
 * cal.com "apply standard pagination to /bookings" (367e2666). Deterministic: drive
 * "next" to the end and compare the collected ids against the full set.
 */
const subject = (variant: PagingVariant): ReactPagingSubject => ({
  name: `paging-${variant}`,
  render: buildPagedList(variant),
  next: { role: 'button', name: /next/i },
  itemTestId: 'paged-item',
  expectedIds: [...ALL_IDS],
});

const pagingStatus = async (variant: PagingVariant) => {
  const v = await verify(paginationIntegrity, subject(variant));
  return v.results.find((r) => r.criterionId === 'pages-cover-the-set');
};

describe('AVP — verifier accuracy (pagination-integrity · pages-cover-the-set)', () => {
  it('fails the BAD list on "pages-cover-the-set" (dropped row at a boundary — escape documenso:7d257236)', async () => {
    const target = await pagingStatus('off-by-one');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD list with no false alarm (pages cover the set exactly once)', async () => {
    const v = await verify(paginationIntegrity, subject('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the pages-cover-the-set number', async () => {
    const detected = (await pagingStatus('off-by-one'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await pagingStatus('good'))?.status === 'fail' ? 1 : 0;
    // eslint-disable-next-line no-console
    console.log(`\n[AVP] pagination-integrity pages-cover-the-set detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for pages-cover-the-set — distinct ways the page-boundary math
 * breaks the union: an off-by-one (1-indexed) offset that drops rows, overlapping
 * windows that repeat rows, a page param ignored entirely (default pagination
 * missing), and an unstable sort that strands one row and loses another. A robust
 * criterion kills every one while leaving the correctly-paged GOOD list green.
 */
const MUTANTS: readonly PagingVariant[] = ['off-by-one', 'overlap', 'first-page-only', 'unstable-sort'];

describe('AVP — mutation testing (pagination-integrity · pages-cover-the-set)', () => {
  it('kills every broken-paging mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await pagingStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await pagingStatus('good'))?.status === 'fail';
    // eslint-disable-next-line no-console
    console.log(
      `\n[AVP mutation] pagination-integrity · pages-cover-the-set: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the correctly-paged list').toBe(false);
  });
});
