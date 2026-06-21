import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Browser, Page } from 'puppeteer-core';
import { openBrowser, chromePath } from '../src/adapter-design/browser';
import { verifyDesignBrowser } from '../src/adapter-design/browser-verify';
import { rtlIntegrity } from '../src/archetypes/rtl-integrity';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildRtlNav, type RtlVariant } from './dataset/rtl-icons';

/**
 * AVP Design — rtl-integrity · directional-icons-mirror. The thirteenth design criterion
 * (geometry tier): a direction-dependent icon (back/next chevron) must mirror under dir=rtl
 * and only under rtl, so it points the right way in RTL locales. Distinct from
 * icon-correctness (the glyph's MEANING) — here the glyph is right but its ORIENTATION under
 * RTL is wrong. Measured in real Chrome by reading each directional icon's computed transform
 * under both writing directions. Faithful: Mastodon 51345e51. Skips honestly with no Chrome.
 */
const hasBrowser = chromePath() !== null;
const subject = (variant: RtlVariant): ReactDesignSubject => ({
  name: `rtl-${variant}`,
  render: buildRtlNav(variant),
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

const rtlStatus = async (variant: RtlVariant) => {
  const v = await verifyDesignBrowser(rtlIntegrity, subject(variant), page);
  return v.results.find((r) => r.criterionId === 'directional-icons-mirror');
};

describe.skipIf(!hasBrowser)('AVP Design — verifier accuracy (rtl-integrity · directional-icons-mirror)', () => {
  it('fails the BAD nav on "directional-icons-mirror" (back arrow not flipped under rtl — escape mastodon:51345e51)', async () => {
    const target = await rtlStatus('no-flip');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  }, 20_000);

  it('passes the GOOD nav with no false alarm (both directional icons flip only under rtl)', async () => {
    const v = await verifyDesignBrowser(rtlIntegrity, subject('good'), page);
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  }, 20_000);

  it('emits the rtl-integrity number', async () => {
    const detected = (await rtlStatus('no-flip'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await rtlStatus('good'))?.status === 'fail' ? 1 : 0;
    // eslint-disable-next-line no-console
    console.log(`\n[AVP Design] rtl-integrity directional-icons-mirror detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  }, 20_000);
});

/**
 * Mutation family for directional-icons-mirror — distinct ways the RTL flip goes wrong: no
 * flip at all, only one of the two directional icons flipped, and a flip not scoped to rtl
 * (so it mirrors under ltr too). A robust criterion kills every one while leaving the
 * correctly-scoped GOOD nav green.
 */
const MUTANTS: readonly RtlVariant[] = ['no-flip', 'partial-flip', 'flip-always'];

describe.skipIf(!hasBrowser)('AVP Design — mutation testing (rtl-integrity · directional-icons-mirror)', () => {
  it('kills every RTL-mirroring mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await rtlStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await rtlStatus('good'))?.status === 'fail';
    // eslint-disable-next-line no-console
    console.log(
      `\n[AVP Design mutation] rtl-integrity · directional-icons-mirror: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the correctly-scoped nav').toBe(false);
  }, 30_000);
});
