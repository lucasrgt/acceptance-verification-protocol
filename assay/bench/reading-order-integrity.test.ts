import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Browser, Page } from 'puppeteer-core';
import { openBrowser } from '../src/adapter-design/browser';
import { verifyDesignBrowser } from '../src/adapter-design/browser-verify';
import { readingOrderIntegrity } from '../src/archetypes/reading-order-integrity';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildReadingOrderHeader, type ReadingOrderVariant } from './dataset/reading-order';

/**
 * AVP Design — reading-order-integrity · dom-order-matches-visual. The twelfth design
 * criterion (geometry tier) and an accessibility one: the DOM/focus order must match the
 * visual reading order (top→bottom, left→right). The escape is CSS reordering (flex `order`,
 * column-reverse, absolute) that moves an element visually but not in the DOM, desyncing
 * keyboard/screen-reader order from what is seen. Distinct from composition-canonical (DOM
 * order vs a DECLARED spec) — here the VISUAL geometry is the ground truth. Measured in real
 * Chrome via getBoundingClientRect. Faithful: Mastodon d20d0492. Skips honestly with no Chrome.
 */
const subject = (variant: ReadingOrderVariant): ReactDesignSubject => ({
  name: `reading-order-${variant}`,
  render: buildReadingOrderHeader(variant),
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

const orderStatus = async (variant: ReadingOrderVariant) => {
  const v = await verifyDesignBrowser(readingOrderIntegrity, subject(variant), page);
  return v.results.find((r) => r.criterionId === 'dom-order-matches-visual');
};

describe('AVP Design — verifier accuracy (reading-order-integrity · dom-order-matches-visual)', () => {
  it('fails the BAD header on "dom-order-matches-visual" (flex order pulls time to the front — escape mastodon:d20d0492)', async () => {
    const target = await orderStatus('flex-order');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  }, 20_000);

  it('passes the GOOD header with no false alarm (DOM order == visual order)', async () => {
    const v = await verifyDesignBrowser(readingOrderIntegrity, subject('good'), page);
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  }, 20_000);

  it('emits the reading-order-integrity number', async () => {
    const detected = (await orderStatus('flex-order'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await orderStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP Design] reading-order-integrity dom-order-matches-visual detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  }, 20_000);
});

/**
 * Mutation family for dom-order-matches-visual — distinct ways CSS desyncs visual order from
 * DOM order: flex `order`, column-reverse, and absolute positioning. A robust criterion kills
 * every one while leaving the in-flow GOOD header green.
 */
const MUTANTS: readonly ReadingOrderVariant[] = ['flex-order', 'column-reverse', 'absolute-bump'];

describe('AVP Design — mutation testing (reading-order-integrity · dom-order-matches-visual)', () => {
  it('kills every visual-vs-DOM desync mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await orderStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await orderStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP Design mutation] reading-order-integrity · dom-order-matches-visual: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the in-flow header').toBe(false);
  }, 30_000);
});
