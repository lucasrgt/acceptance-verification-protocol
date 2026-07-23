import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Browser, Page } from 'puppeteer-core';
import { openBrowser } from '../src/adapter-design/browser';
import { verifyDesignBrowser } from '../src/adapter-design/browser-verify';
import { layoutIntegrity } from '../src/archetypes/layout-integrity';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildOverflowCard, type OverflowVariant } from './dataset/overflow-card';

/**
 * AVP Design — layout-integrity · content-fits. The eighth design criterion and the
 * FIRST of the geometry tier: content must not be clipped by a fixed box. Measured in a
 * REAL browser (headless Chrome via puppeteer-core) because jsdom has no layout engine
 * (offsetWidth = 0). Faithful: cal.com's overflow cluster (78 fixes). The scientific
 * gate requires Chrome/Edge and fails setup when the geometry substrate is unavailable.
 */
const subject = (variant: OverflowVariant): ReactDesignSubject => ({
  name: `overflow-${variant}`,
  render: buildOverflowCard(variant),
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

const layoutStatus = async (variant: OverflowVariant) => {
  const v = await verifyDesignBrowser(layoutIntegrity, subject(variant), page);
  return v.results.find((r) => r.criterionId === 'content-fits');
};

describe('AVP Design — verifier accuracy (layout-integrity · content-fits)', () => {
  it('fails the BAD card on "content-fits" (label cut off — escape calcom:a1124ede)', async () => {
    const target = await layoutStatus('clip-horizontal');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  }, 20_000);

  it('passes the GOOD card with no false alarm (content wraps and fits)', async () => {
    const v = await verifyDesignBrowser(layoutIntegrity, subject('good'), page);
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  }, 20_000);

  it('emits the layout-integrity number', async () => {
    const detected = (await layoutStatus('clip-horizontal'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await layoutStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP Design] layout-integrity content-fits detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  }, 20_000);
});

/**
 * Mutation family for content-fits — distinct ways content is clipped: a horizontal
 * cut (nowrap long text), a vertical cut (text past a fixed height), and a button label
 * clipped. A robust criterion kills every one while leaving the roomy GOOD card green.
 */
const MUTANTS: readonly OverflowVariant[] = ['clip-horizontal', 'clip-vertical', 'button-clip'];

describe('AVP Design — mutation testing (layout-integrity · content-fits)', () => {
  it('kills every clipped-content mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await layoutStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await layoutStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP Design mutation] layout-integrity · content-fits: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the roomy card').toBe(false);
  }, 30_000);
});
