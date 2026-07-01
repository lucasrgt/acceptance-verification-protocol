import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Browser, Page } from 'puppeteer-core';
import { openBrowser, chromePath } from '../src/adapter-design/browser';
import { verifyDesignBrowser } from '../src/adapter-design/browser-verify';
import { responsiveIntegrity } from '../src/archetypes/responsive-integrity';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildResponsiveToolbar, type ResponsiveVariant } from './dataset/responsive-row';

/**
 * AVP Design — responsive-integrity · holds-across-breakpoints. The tenth design criterion
 * (geometry tier) and the cross-viewport one: the SAME surface is swept across viewport
 * widths and must hold at every one. The escape is "fits wide, breaks narrow" — only a
 * multi-viewport sweep catches it, which neither layout- nor layer-integrity (both
 * single-width) can. Measured in real Chrome via documentElement.scrollWidth at each
 * breakpoint. Faithful: Mastodon "columns not using mobile styles" (98ec6991). Skips
 * honestly if no Chrome/Edge is installed.
 */
const hasBrowser = chromePath() !== null;
const subject = (variant: ResponsiveVariant): ReactDesignSubject => ({
  name: `responsive-${variant}`,
  render: buildResponsiveToolbar(variant),
});

let browser: Browser | undefined;
let page: Page;

beforeAll(async () => {
  if (!hasBrowser) return;
  browser = await openBrowser();
  page = await browser.newPage();
}, 60_000);

afterAll(async () => {
  await browser?.close();
});

const responsiveStatus = async (variant: ResponsiveVariant) => {
  const v = await verifyDesignBrowser(responsiveIntegrity, subject(variant), page);
  return v.results.find((r) => r.criterionId === 'holds-across-breakpoints');
};

describe.skipIf(!hasBrowser)('AVP Design — verifier accuracy (responsive-integrity · holds-across-breakpoints)', () => {
  it('fails the BAD surface on "holds-across-breakpoints" (fixed row overflows narrow — escape mastodon:98ec6991)', async () => {
    const target = await responsiveStatus('fixed-row');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  }, 20_000);

  it('passes the GOOD surface with no false alarm (the row wraps and fits every breakpoint)', async () => {
    const v = await verifyDesignBrowser(responsiveIntegrity, subject('good'), page);
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  }, 20_000);

  it('emits the responsive-integrity number', async () => {
    const detected = (await responsiveStatus('fixed-row'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await responsiveStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP Design] responsive-integrity holds-across-breakpoints detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  }, 20_000);
});

/**
 * Mutation family for holds-across-breakpoints — distinct ways a surface that fits wide
 * breaks at a narrow viewport: a nowrap fixed-width row, a single oversized block, and a
 * nowrap heading. A robust criterion kills every one while leaving the wrapping GOOD
 * surface green.
 */
const MUTANTS: readonly ResponsiveVariant[] = ['fixed-row', 'wide-block', 'nowrap-heading'];

describe.skipIf(!hasBrowser)('AVP Design — mutation testing (responsive-integrity · holds-across-breakpoints)', () => {
  it('kills every narrow-viewport-overflow mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await responsiveStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await responsiveStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP Design mutation] responsive-integrity · holds-across-breakpoints: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the wrapping surface').toBe(false);
  }, 30_000);
});
