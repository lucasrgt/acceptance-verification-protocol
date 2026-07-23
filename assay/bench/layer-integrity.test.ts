import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Browser, Page } from 'puppeteer-core';
import { openBrowser } from '../src/adapter-design/browser';
import { verifyDesignBrowser } from '../src/adapter-design/browser-verify';
import { layerIntegrity } from '../src/archetypes/layer-integrity';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildOverlapForm, type LayerVariant } from './dataset/overlap-regions';

/**
 * AVP Design — layer-integrity · no-unintended-overlap. The ninth design criterion
 * (geometry tier): two in-flow regions that should stack must not visually overlap.
 * Distinct from layout-integrity (an element clipping its OWN content) — this is two
 * SEPARATE elements colliding. Measured in real Chrome via getBoundingClientRect.
 * Faithful: cal.com "Continue button overlaps Bio textarea" (44ccc72f). Skips honestly
 * if no Chrome/Edge is installed.
 */
const subject = (variant: LayerVariant): ReactDesignSubject => ({
  name: `overlap-${variant}`,
  render: buildOverlapForm(variant),
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

const layerStatus = async (variant: LayerVariant) => {
  const v = await verifyDesignBrowser(layerIntegrity, subject(variant), page);
  return v.results.find((r) => r.criterionId === 'no-unintended-overlap');
};

describe('AVP Design — verifier accuracy (layer-integrity · no-unintended-overlap)', () => {
  it('fails the BAD form on "no-unintended-overlap" (button over the textarea — escape calcom:44ccc72f)', async () => {
    const target = await layerStatus('absolute-overlap');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  }, 20_000);

  it('passes the GOOD form with no false alarm (the regions stack)', async () => {
    const v = await verifyDesignBrowser(layerIntegrity, subject('good'), page);
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  }, 20_000);

  it('emits the layer-integrity number', async () => {
    const detected = (await layerStatus('absolute-overlap'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await layerStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP Design] layer-integrity no-unintended-overlap detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  }, 20_000);
});

/**
 * Mutation family for no-unintended-overlap — distinct ways two regions collide: an
 * absolutely-positioned block, a negative margin, and a transform. A robust criterion
 * kills every one while leaving the stacked GOOD form green.
 */
const MUTANTS: readonly LayerVariant[] = ['absolute-overlap', 'negative-margin', 'translate-overlap'];

describe('AVP Design — mutation testing (layer-integrity · no-unintended-overlap)', () => {
  it('kills every region-collision mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await layerStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await layerStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP Design mutation] layer-integrity · no-unintended-overlap: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the stacked form').toBe(false);
  }, 30_000);
});
