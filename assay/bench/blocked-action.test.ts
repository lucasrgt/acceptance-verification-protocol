import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { lifecycleGate } from '../src/archetypes/lifecycle-gate';
import type { ReactLifecycleSubject } from '../src/adapter-react/lifecycle-gate';
import { buildBlockedScreen, type BlockedVariant } from './dataset/blocked-action';

/**
 * lifecycle-gate · blocked-action-is-disabled — the DOM half of the lifecycle-gate
 * archetype (its server half, gate-enforced-server-side, runs over HTTP). With a
 * precondition unmet, the FE must disable the action and say why, not offer a live
 * control that fails. This makes lifecycle-gate the first archetype EXECUTED across
 * both substrates. Faithful escape (publishing offered on an incomplete listing);
 * confirmed cross-stack by documenso's "disable cert download when document not
 * complete" (41ed6c9a).
 */
const blocked = (variant: BlockedVariant): ReactLifecycleSubject => ({
  name: `blocked-${variant}`,
  render: buildBlockedScreen(variant),
  action: { role: 'button', name: /publish/i },
  reasonMarker: /required fields/i,
});

const blockedStatus = async (variant: BlockedVariant) => {
  const v = await verify(lifecycleGate, blocked(variant));
  return v.results.find((r) => r.criterionId === 'blocked-action-is-disabled');
};

describe('AVP — verifier accuracy (lifecycle-gate · blocked-action-is-disabled)', () => {
  it('fails the BAD screen on "blocked-action-is-disabled" (live control — escape documenso:41ed6c9a)', async () => {
    const target = await blockedStatus('enabled');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD screen with no false alarm (backend criterion skipped by adapter)', async () => {
    const v = await verify(lifecycleGate, blocked('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
    expect(v.results.find((r) => r.criterionId === 'gate-enforced-server-side')?.status).toBe('skipped');
  });

  it('emits the blocked-action-is-disabled number', async () => {
    const detected = (await blockedStatus('enabled'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await blockedStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP] lifecycle-gate blocked-action-is-disabled detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for blocked-action-is-disabled — distinct ways the FE offers a
 * blocked action anyway (a live button, one that only looks disabled, an
 * aria-disabled="false" lie, a disabled button with no reason). A robust criterion
 * kills every one while leaving the correctly-disabled GOOD screen green.
 */
const MUTANTS: readonly BlockedVariant[] = ['enabled', 'enabled-styled', 'aria-false', 'no-reason'];

describe('AVP — mutation testing (lifecycle-gate · blocked-action-is-disabled)', () => {
  it('kills every offered-blocked-action mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await blockedStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await blockedStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP mutation] lifecycle-gate · blocked-action-is-disabled: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the disabled control').toBe(false);
  });
});
