import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Browser, Page } from 'puppeteer-core';
import { openBrowser } from '../src/adapter-design/browser';
import { verifyDesignBrowser } from '../src/adapter-design/browser-verify';
import { truncationIntegrity } from '../src/archetypes/truncation-integrity';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildTruncCard, type TruncationVariant } from './dataset/truncation-text';

/**
 * AVP Design — truncation-integrity · overflowing-text-is-truncated. A geometry-tier criterion:
 * text overflowing a constrained box must be handled gracefully (ellipsis / line-clamp / scroll),
 * never spill out or get hard-clipped with no affordance. Distinct from layout-integrity
 * (content-fits), which is blind to the affordance and faults any clip. Measured in real Chrome via
 * scrollWidth/scrollHeight + computed overflow. Faithful: cal.com's truncation cluster
 * (calcom:f63d70552, calcom:22201cbc7, calcom:3af6fee05). Skips honestly with no Chrome.
 */
const subject = (variant: TruncationVariant): ReactDesignSubject => ({
  name: `trunc-${variant}`,
  render: buildTruncCard(variant),
});

let browser: Browser | undefined;
let page: Page;

beforeAll(async () => {
  browser = await openBrowser();
  page = await browser.newPage();
}, 60_000);

afterAll(async () => {
  await browser?.close();
});

const truncStatus = async (variant: TruncationVariant) => {
  const v = await verifyDesignBrowser(truncationIntegrity, subject(variant), page);
  return v.results.find((r) => r.criterionId === 'overflowing-text-is-truncated');
};

describe('AVP Design — verifier accuracy (truncation-integrity · overflowing-text-is-truncated)', () => {
  it('fails the BAD card on "overflowing-text-is-truncated" (a long URL spilling out — escape calcom:f63d70552)', async () => {
    const target = await truncStatus('spill-x');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  }, 20_000);

  it('passes every graceful affordance with no false alarm (ellipsis, line-clamp, scroll)', async () => {
    for (const good of ['good', 'good-clamp', 'good-scroll'] as const) {
      const v = await verifyDesignBrowser(truncationIntegrity, subject(good), page);
      const fails = v.results.filter((r) => r.status === 'fail');
      expect(fails, `${good}: ${JSON.stringify(fails, null, 2)}`).toHaveLength(0);
      expect(v.acceptanceScore, good).toBe(1);
    }
  }, 30_000);

  it('emits the truncation-integrity number', async () => {
    const detected = (await truncStatus('spill-x'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await truncStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP Design] truncation-integrity overflowing-text-is-truncated detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  }, 20_000);
});

/**
 * Mutation family for overflowing-text-is-truncated — distinct ways constrained text overflows with
 * no affordance: a horizontal spill (overflow visible), a horizontal hard-clip (overflow hidden, no
 * ellipsis), a vertical hard-clip (fixed height, no line-clamp), and a vertical spill. A robust
 * criterion kills every one while leaving all three graceful affordances green.
 */
const MUTANTS: readonly TruncationVariant[] = ['spill-x', 'hard-clip-x', 'clip-y', 'spill-y'];
const GOODS: readonly TruncationVariant[] = ['good', 'good-clamp', 'good-scroll'];

describe('AVP Design — mutation testing (truncation-integrity · overflowing-text-is-truncated)', () => {
  it('kills every untruncated-overflow mutant + no false alarm on any affordance', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await truncStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarms: string[] = [];
    for (const g of GOODS) if ((await truncStatus(g))?.status === 'fail') falseAlarms.push(g);
     
    console.log(
      `\n[AVP Design mutation] truncation-integrity · overflowing-text-is-truncated: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarms.length ? `  FALSE-ALARM=[${falseAlarms.join(', ')}]` : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarms, `false alarm on a graceful affordance: ${falseAlarms.join(', ')}`).toHaveLength(0);
  }, 40_000);
});
