import { describe, it, expect } from 'vitest';
import { verifyDesign } from '../src/adapter-design/verify';
import { imageAlt } from '../src/archetypes/image-alt';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildImagesPage, type ImagesVariant } from './dataset/images-page';

/**
 * AVP Design — image-alt · images-have-text-alternative. A `dom`-substrate a11y criterion
 * (the accessibility tree — no computed style, no layout): every informative image exposes
 * a text alternative, while a deliberately-decorative image (alt="") is not flagged. The #2
 * most common real-world a11y violation, mechanical, faithfully grounded in cal.com's alt-text
 * fixes (fa20f19e, 55113f20) and documenso (df9c603a). Deterministic in jsdom: render, walk
 * the images, resolve each text alternative, skip the decorative.
 */
const subject = (variant: ImagesVariant): ReactDesignSubject => ({
  name: `image-alt-${variant}`,
  render: buildImagesPage(variant),
});

const altStatus = async (variant: ImagesVariant) => {
  const v = await verifyDesign(imageAlt, subject(variant));
  return v.results.find((r) => r.criterionId === 'images-have-text-alternative');
};

describe('AVP Design — verifier accuracy (image-alt · images-have-text-alternative)', () => {
  it('fails the BAD page on "images-have-text-alternative" (logo image with no alt — escape fa20f19e)', async () => {
    const target = await altStatus('logo-no-alt');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD page with no false alarm (every informative image named, divider decorative)', async () => {
    const v = await verifyDesign(imageAlt, subject('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the image-alt number', async () => {
    const detected = (await altStatus('logo-no-alt'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await altStatus('good'))?.status === 'fail' ? 1 : 0;
    // eslint-disable-next-line no-console
    console.log(`\n[AVP Design] image-alt images-have-text-alternative detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for images-have-text-alternative — distinct ways an informative image
 * loses its text alternative: a logo with no alt attribute, an avatar with no alt, a
 * role="img" graphic with no aria-label, and a logo with an empty (present-but-nameless)
 * aria-label. A robust criterion kills every one while leaving the GOOD page green — and
 * crucially never flags the deliberately-decorative divider (alt="").
 */
const MUTANTS: readonly ImagesVariant[] = ['logo-no-alt', 'avatar-no-alt', 'chart-no-name', 'empty-aria-label'];

describe('AVP Design — mutation testing (image-alt · images-have-text-alternative)', () => {
  it('kills every missing-alt mutant + no false alarm on decorative', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await altStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await altStatus('good'))?.status === 'fail';
    // eslint-disable-next-line no-console
    console.log(
      `\n[AVP Design mutation] image-alt · images-have-text-alternative: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the page with a decorative divider').toBe(false);
  });
});
