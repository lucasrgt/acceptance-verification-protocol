import { describe, it, expect } from 'vitest';
import type { Judge } from '../src/core/dsl';
import { verifyDesign } from '../src/adapter-design/verify';
import { iconCorrectness } from '../src/archetypes/icon-correctness';
import type { IconEvidence } from '../src/adapter-design/icon-correctness';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildIconToolbar, type IconVariant } from './dataset/icon-toolbar';

/**
 * AVP Design — icon-correctness · icon-fits-meaning. The eleventh design criterion and the
 * MODEL-oracle one (the last non-mechanical criterion): does each icon's MEANING fit its
 * control's label? composition-canonical already checks an icon is PRESENT; this checks it
 * means the right thing — a semantic call only a judge can make. The bench injects a
 * deterministic stub judge (no network, like model-oracle.test.ts) encoding the meaning-fit
 * rule over the gathered evidence; the live Claude path is covered by claude-judge.test.ts.
 * The real verification value here is that the adapter gathers ENOUGH evidence (icon + the
 * control's accessible label) for a judge to catch each mismatch. Faithful: Gitea "use
 * repo-forked icon to display forks count" (edf0dfd1).
 */
const subject = (variant: IconVariant): ReactDesignSubject => ({
  name: `icon-${variant}`,
  render: buildIconToolbar(variant),
});

// The acceptable glyph families per label keyword — the deterministic stand-in for the
// model's semantic judgment, applied to the evidence the adapter actually gathered.
const FIT: Record<string, readonly string[]> = {
  back: ['arrow-left', 'chevron-left'],
  forks: ['git-fork', 'fork', 'git-branch'],
  search: ['search', 'magnifier'],
  delete: ['trash', 'trash-2'],
};

const ruleJudge: Judge = (req) => {
  const { icons } = req.evidence as IconEvidence;
  for (const { icon, label } of icons) {
    const key = Object.keys(FIT).find((k) => label.toLowerCase().includes(k));
    if (key && !FIT[key].includes(icon)) {
      return { pass: false, reason: `icon "${icon}" does not fit the "${label}" control` };
    }
  }
  return { pass: true, reason: 'every icon fits its control' };
};

const iconStatus = async (variant: IconVariant, judge?: Judge) => {
  const v = await verifyDesign(iconCorrectness, subject(variant), judge ? { judge } : {});
  return v.results.find((r) => r.criterionId === 'icon-fits-meaning');
};

describe('AVP Design — verifier accuracy (icon-correctness · icon-fits-meaning)', () => {
  it('is skipped honestly when no judge is provided (never inflates the score)', async () => {
    const m = await iconStatus('good');
    expect(m?.status).toBe('skipped');
  });

  it('gathers each icon paired with its control’s accessible label as evidence', async () => {
    const v = await verifyDesign(iconCorrectness, subject('good'), { judge: ruleJudge });
    const m = v.results.find((r) => r.criterionId === 'icon-fits-meaning');
    const ev = m?.evidence as IconEvidence;
    expect(ev.icons).toEqual([
      { icon: 'arrow-left', label: 'Back' },
      { icon: 'git-fork', label: 'Forks' },
      { icon: 'search', label: 'Search' },
      { icon: 'trash', label: 'Delete' },
    ]);
  });

  it('fails the BAD surface on "icon-fits-meaning" (a generic file glyph for the forks count — escape gitea:edf0dfd1)', async () => {
    const m = await iconStatus('wrong-forks', ruleJudge);
    expect(m, 'criterion missing').toBeDefined();
    expect(m?.status, m?.reason).toBe('fail');
  });

  it('passes the GOOD surface with no false alarm (every icon fits its control)', async () => {
    const v = await verifyDesign(iconCorrectness, subject('good'), { judge: ruleJudge });
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the icon-correctness number', async () => {
    const detected = (await iconStatus('wrong-forks', ruleJudge))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await iconStatus('good', ruleJudge))?.status === 'fail' ? 1 : 0;
    // eslint-disable-next-line no-console
    console.log(`\n[AVP Design] icon-correctness icon-fits-meaning detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for icon-fits-meaning — distinct semantic mismatches the gathered evidence
 * must expose to a judge: a trash glyph on Back, a generic file on the forks count, a bell on
 * Search. Every one must be caught (proving the evidence carries icon + label) while the
 * coherent GOOD surface stays green.
 */
const MUTANTS: readonly IconVariant[] = ['wrong-back', 'wrong-forks', 'wrong-search'];

describe('AVP Design — mutation testing (icon-correctness · icon-fits-meaning)', () => {
  it('kills every wrong-icon mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await iconStatus(m, ruleJudge))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await iconStatus('good', ruleJudge))?.status === 'fail';
    // eslint-disable-next-line no-console
    console.log(
      `\n[AVP Design mutation] icon-correctness · icon-fits-meaning: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the coherent surface').toBe(false);
  });
});
