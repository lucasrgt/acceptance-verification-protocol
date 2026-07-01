import { describe, it, expect } from 'vitest';
import { verifyDesign } from '../src/adapter-design/verify';
import { typeHierarchy } from '../src/archetypes/type-hierarchy';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildHeadingPage, type HeadingVariant } from './dataset/heading-page';

/**
 * AVP Design — type-hierarchy · hierarchy-holds. The third design criterion: visual
 * type size must match the semantic heading level (h1 > h2 > h3; same level, same
 * size). Distinct from token-adherence (size ON the scale) — this is the ORDERING.
 * Faithful: "one type scale" (25b16a79), "the real type scale" (9b609f8c), "drop
 * redundant per-step headings" (7a2dfc74). Deterministic in jsdom: read heading
 * font-sizes + levels, compare.
 */
const subject = (variant: HeadingVariant): ReactDesignSubject => ({
  name: `type-${variant}`,
  render: buildHeadingPage(variant),
});

const typeStatus = async (variant: HeadingVariant) => {
  const v = await verifyDesign(typeHierarchy, subject(variant));
  return v.results.find((r) => r.criterionId === 'hierarchy-holds');
};

describe('AVP Design — verifier accuracy (type-hierarchy · hierarchy-holds)', () => {
  it('fails the BAD page on "hierarchy-holds" (section title bigger than the page title — escape 7a2dfc74)', async () => {
    const target = await typeStatus('inverted');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD page with no false alarm (monotonic type scale)', async () => {
    const v = await verifyDesign(typeHierarchy, subject('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the type-hierarchy number', async () => {
    const detected = (await typeStatus('inverted'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await typeStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP Design] type-hierarchy hierarchy-holds detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for hierarchy-holds — distinct ways the size/level order breaks: an
 * inverted title (h1 smaller than its sections), equal-weight title and section, a
 * subsection louder than the title, and two same-level headings at different sizes. A
 * robust criterion kills every one while leaving the monotonic GOOD page green.
 */
const MUTANTS: readonly HeadingVariant[] = ['inverted', 'equal-weight', 'subtitle-beats-title', 'inconsistent-h2'];

describe('AVP Design — mutation testing (type-hierarchy · hierarchy-holds)', () => {
  it('kills every broken-hierarchy mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await typeStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await typeStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP Design mutation] type-hierarchy · hierarchy-holds: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the monotonic page').toBe(false);
  });
});
