import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { actionEffect } from '../src/archetypes/action-effect';
import type { ActionEffectSubject } from '../src/adapter-react/subject';
import { buildOptimisticCounter, type OptimisticVariant } from './dataset/optimistic-counter';

/**
 * action-effect · optimistic-reconcile. An optimistic count bump must reconcile to
 * the server's authoritative value (12) — not drift on the optimistic guess (11).
 * Faithful escape (count-based optimistic state never reconciled); confirmed
 * cross-stack by documenso's reconcile/sync-to-truth fixes (eb45d1e5, ed7a0011).
 * Shares the action-effect archetype with the other action criteria, gated by the
 * reconcile seam.
 */
const optimistic = (variant: OptimisticVariant): ActionEffectSubject => ({
  name: `optimistic-${variant}`,
  render: buildOptimisticCounter(variant),
  endpoint: { method: 'POST', path: 'http://localhost/api/like' },
  action: { role: 'button', name: /like/i },
  successResponse: { count: 12 }, // the server's authoritative value
  reconcile: { readout: { role: 'status' }, serverCount: 12 },
});

const reconcileStatus = async (variant: OptimisticVariant) => {
  const v = await verify(actionEffect, optimistic(variant));
  return v.results.find((r) => r.criterionId === 'optimistic-reconcile');
};

describe('AVP — verifier accuracy (action-effect · optimistic-reconcile)', () => {
  it('fails the BAD counter on "optimistic-reconcile" (permanent drift — escape documenso:eb45d1e5)', async () => {
    const target = await reconcileStatus('no-reconcile');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD counter with no false alarm (only the reconcile criterion applies)', async () => {
    const v = await verify(actionEffect, optimistic('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
    expect(v.results.find((r) => r.criterionId === 'no-phantom-success')?.status).toBe('not-applicable');
  });

  it('emits the optimistic-reconcile number', async () => {
    const detected = (await reconcileStatus('no-reconcile'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await reconcileStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP] action-effect optimistic-reconcile detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for optimistic-reconcile — distinct ways an optimistic count fails
 * to settle on server truth (keep the guess, add the two, revert to a stale value). A
 * robust criterion kills every one while leaving the reconciling GOOD counter green.
 */
const MUTANTS: readonly OptimisticVariant[] = ['no-reconcile', 'wrong-merge', 'revert-stale'];

describe('AVP — mutation testing (action-effect · optimistic-reconcile)', () => {
  it('kills every optimistic-drift mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await reconcileStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await reconcileStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP mutation] action-effect · optimistic-reconcile: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the reconciling counter').toBe(false);
  });
});
