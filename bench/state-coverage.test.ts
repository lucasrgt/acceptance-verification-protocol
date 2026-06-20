import { describe, it, expect } from 'vitest';
import { verifyDesign } from '../src/adapter-design/verify';
import { stateCoverage } from '../src/archetypes/state-coverage';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildStatefulButton, type StateVariant } from './dataset/stateful-button';

/**
 * AVP Design — state-coverage · states-visually-distinct. The fifth design criterion:
 * each declared interactive state (disabled, loading) renders visually distinct from
 * default — the runtime, visual sibling of LZFE010 state-completeness. The escape is a
 * state that is set but not painted (a `disabled` button that looks identical).
 * Faithful: "drive disabled dimming via inline style" (c86c36b3), "single upload
 * spinner" (f842d42c). Deterministic: render default + each state, compare signatures.
 */
const subject = (variant: StateVariant): ReactDesignSubject => ({
  name: `state-${variant}`,
  states: ['disabled', 'loading'],
  renderState: buildStatefulButton(variant),
});

const stateStatus = async (variant: StateVariant) => {
  const v = await verifyDesign(stateCoverage, subject(variant));
  return v.results.find((r) => r.criterionId === 'states-visually-distinct');
};

describe('AVP Design — verifier accuracy (state-coverage · states-visually-distinct)', () => {
  it('fails the BAD button on "states-visually-distinct" (disabled not dimmed — escape c86c36b3)', async () => {
    const target = await stateStatus('disabled-not-dimmed');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD button with no false alarm (every state painted distinctly)', async () => {
    const v = await verifyDesign(stateCoverage, subject('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the state-coverage number', async () => {
    const detected = (await stateStatus('disabled-not-dimmed'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await stateStatus('good'))?.status === 'fail' ? 1 : 0;
    // eslint-disable-next-line no-console
    console.log(`\n[AVP Design] state-coverage states-visually-distinct detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for states-visually-distinct — distinct ways a state goes unpainted:
 * a disabled control that isn't dimmed, a loading control with no spinner, and a button
 * where no state is painted at all. A robust criterion kills every one while leaving
 * the fully-painted GOOD button green.
 */
const MUTANTS: readonly StateVariant[] = ['disabled-not-dimmed', 'loading-no-spinner', 'all-flat'];

describe('AVP Design — mutation testing (state-coverage · states-visually-distinct)', () => {
  it('kills every unpainted-state mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await stateStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await stateStatus('good'))?.status === 'fail';
    // eslint-disable-next-line no-console
    console.log(
      `\n[AVP Design mutation] state-coverage · states-visually-distinct: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the fully-painted button').toBe(false);
  });
});
