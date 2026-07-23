import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Browser, Page } from 'puppeteer-core';
import { openBrowser } from '../src/adapter-design/browser';
import { verifyDesignBrowser } from '../src/adapter-design/browser-verify';
import { layoutShiftIntegrity } from '../src/archetypes/layout-shift-integrity';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildLayoutShiftCard, type LayoutShiftVariant } from './dataset/layout-shift';

/**
 * AVP Design — layout-shift-integrity · reserved-space-stable. The fifteenth design criterion
 * (geometry tier) and the TEMPORAL one: async content must reserve its space so a downstream
 * anchor keeps its position between the loading and loaded states (no cumulative layout shift).
 * Distinct from every other geometry criterion (all single-layout) — this compares the layout
 * BEFORE and AFTER load via the renderState seam. Measured in real Chrome via
 * getBoundingClientRect. Faithful: the layout-shift cluster (mastodon:511e10df,
 * gitea:32fdfb0b, documenso:1a23744d). Skips honestly with no Chrome.
 */
const subject = (variant: LayoutShiftVariant): ReactDesignSubject => ({
  name: `shift-${variant}`,
  renderState: buildLayoutShiftCard(variant),
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

const shiftStatus = async (variant: LayoutShiftVariant) => {
  const v = await verifyDesignBrowser(layoutShiftIntegrity, subject(variant), page);
  return v.results.find((r) => r.criterionId === 'reserved-space-stable');
};

describe('AVP Design — verifier accuracy (layout-shift-integrity · reserved-space-stable)', () => {
  it('fails the BAD card on "reserved-space-stable" (an unsized image pushes the caption — escape mastodon:511e10df)', async () => {
    const target = await shiftStatus('unsized-image');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  }, 20_000);

  it('passes the GOOD card with no false alarm (the media reserves a fixed box in both states)', async () => {
    const v = await verifyDesignBrowser(layoutShiftIntegrity, subject('good'), page);
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  }, 20_000);

  it('emits the layout-shift-integrity number', async () => {
    const detected = (await shiftStatus('unsized-image'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await shiftStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP Design] layout-shift-integrity reserved-space-stable detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  }, 20_000);
});

/**
 * Mutation family for reserved-space-stable — distinct sources of an unreserved layout shift:
 * an unsized image, a late-mounting widget, and an expanding banner. A robust criterion kills
 * every one while leaving the reserved GOOD card green.
 */
const MUTANTS: readonly LayoutShiftVariant[] = ['unsized-image', 'late-widget', 'expanding-banner'];

describe('AVP Design — mutation testing (layout-shift-integrity · reserved-space-stable)', () => {
  it('kills every layout-shift mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await shiftStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await shiftStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP Design mutation] layout-shift-integrity · reserved-space-stable: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the reserved card').toBe(false);
  }, 30_000);
});
