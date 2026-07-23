import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Browser, Page } from 'puppeteer-core';
import { openBrowser } from '../src/adapter-design/browser';
import { verifyDesignBrowser } from '../src/adapter-design/browser-verify';
import { focusVisibleIntegrity } from '../src/archetypes/focus-visible-integrity';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildFocusBar, type FocusVariant } from './dataset/focus-targets';

/**
 * AVP Design — focus-visible-integrity · focus-is-visible. The sixteenth design criterion
 * (geometry tier): every interactive control paints a visible focus indicator when focused
 * (WCAG 2.4.7). The escape is `outline: none` / `focus:outline-none` with no replacement ring.
 * Distinct from tap-target (the control's SIZE) and state-coverage (jsdom, declared states): the
 * focus ring is a real `:focus` style change only a browser resolves — jsdom applies no
 * pseudo-class styles. Faithful: cal.com's focus-ring cluster (calcom:7393ba1d1, the "Fixing focus
 * visible" fix). The scientific gate requires an installed Chrome/Edge; a missing
 * geometry substrate fails setup instead of converting absent evidence into a skip.
 */
const subject = (variant: FocusVariant): ReactDesignSubject => ({
  name: `focus-${variant}`,
  render: buildFocusBar(variant),
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

const focusStatus = async (variant: FocusVariant) => {
  const v = await verifyDesignBrowser(focusVisibleIntegrity, subject(variant), page);
  return v.results.find((r) => r.criterionId === 'focus-is-visible');
};

describe('AVP Design — verifier accuracy (focus-visible-integrity · focus-is-visible)', () => {
  it('fails the BAD bar on "focus-is-visible" (focus:outline-none, no ring — escape calcom:7393ba1d1)', async () => {
    const target = await focusStatus('no-indicator');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  }, 20_000);

  it('passes the GOOD bar with no false alarm (every control rings on focus)', async () => {
    const v = await verifyDesignBrowser(focusVisibleIntegrity, subject('good'), page);
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  }, 20_000);

  it('emits the focus-visible-integrity number', async () => {
    const detected = (await focusStatus('no-indicator'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await focusStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP Design] focus-visible-integrity focus-is-visible detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  }, 20_000);
});

/**
 * Mutation family for focus-is-visible — distinct ways the focus indicator is missing or paints
 * nothing: no replacement at all, a transparent ring, a ring bound to :hover not :focus, and a
 * zero-width outline. A robust criterion kills every one while leaving the GOOD ring green.
 */
const MUTANTS: readonly FocusVariant[] = ['no-indicator', 'transparent-ring', 'hover-only', 'zero-outline'];

describe('AVP Design — mutation testing (focus-visible-integrity · focus-is-visible)', () => {
  it('kills every invisible-focus mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await focusStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await focusStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP Design mutation] focus-visible-integrity · focus-is-visible: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the ringed bar').toBe(false);
  }, 30_000);
});
