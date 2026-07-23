import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Browser, Page } from 'puppeteer-core';
import { openBrowser } from '../src/adapter-design/browser';
import { verifyDesignBrowser } from '../src/adapter-design/browser-verify';
import { tapTargetIntegrity } from '../src/archetypes/tap-target-integrity';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildTapTargetBar, type TapTargetVariant } from './dataset/tap-targets';

/**
 * AVP Design — tap-target-integrity · targets-meet-minimum-size. The fourteenth design
 * criterion (geometry tier): every interactive control is at least 44×44 CSS px (WCAG 2.5.5).
 * The escape is a control too small to reliably tap — a bare icon button, a thin link.
 * Distinct from the other geometry criteria (overflow / collision / responsive / order /
 * mirror): this is the control's OWN size against a threshold. Measured in real Chrome via
 * getBoundingClientRect. Faithful: the "clickable area" cluster (mastodon:2b93a221,
 * gitea:8703b6c9). Skips honestly with no Chrome.
 */
const subject = (variant: TapTargetVariant): ReactDesignSubject => ({
  name: `tap-${variant}`,
  render: buildTapTargetBar(variant),
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

const tapStatus = async (variant: TapTargetVariant) => {
  const v = await verifyDesignBrowser(tapTargetIntegrity, subject(variant), page);
  return v.results.find((r) => r.criterionId === 'targets-meet-minimum-size');
};

describe('AVP Design — verifier accuracy (tap-target-integrity · targets-meet-minimum-size)', () => {
  it('fails the BAD bar on "targets-meet-minimum-size" (a 20×20 icon button — escape mastodon:2b93a221)', async () => {
    const target = await tapStatus('tiny-icon');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  }, 20_000);

  it('passes the GOOD bar with no false alarm (every control is 44×44)', async () => {
    const v = await verifyDesignBrowser(tapTargetIntegrity, subject('good'), page);
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  }, 20_000);

  it('emits the tap-target-integrity number', async () => {
    const detected = (await tapStatus('tiny-icon'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await tapStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP Design] tap-target-integrity targets-meet-minimum-size detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  }, 20_000);
});

/**
 * Mutation family for targets-meet-minimum-size — distinct ways a control falls under the
 * minimum: a too-small icon button (both axes), a too-short link (height), a too-narrow button
 * (width). A robust criterion kills every one while leaving the 44×44 GOOD bar green.
 */
const MUTANTS: readonly TapTargetVariant[] = ['tiny-icon', 'thin-link', 'narrow-btn'];

describe('AVP Design — mutation testing (tap-target-integrity · targets-meet-minimum-size)', () => {
  it('kills every undersized-target mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await tapStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await tapStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP Design mutation] tap-target-integrity · targets-meet-minimum-size: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the 44×44 bar').toBe(false);
  }, 30_000);
});
