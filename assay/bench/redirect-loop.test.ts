import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { navigationIntegrity } from '../src/archetypes/navigation-integrity';
import type { RouterNavSubject } from '../src/adapter-react/navigation-router';
import { buildLoopRouter, type LoopVariant } from './dataset/redirect-loop';

/**
 * navigation-integrity · no-redirect-loop (router-mounted). A guard/redirect must
 * resolve in finitely many hops — the router settles on a real screen, it never
 * bounces between routes forever. Faithful escape (the marketplace's role-select
 * infinite redirect loop); confirmed cross-stack by documenso's auth-redirect guards
 * (login/dashboard fixed points).
 */
const loop = (variant: LoopVariant): RouterNavSubject => ({
  name: `loop-${variant}`,
  router: buildLoopRouter(variant),
  redirectLoop: { maxHops: 8 },
});

const loopStatus = async (variant: LoopVariant) => {
  const v = await verify(navigationIntegrity, loop(variant));
  return v.results.find((r) => r.criterionId === 'no-redirect-loop');
};

describe('AVP — verifier accuracy (navigation-integrity · no-redirect-loop)', () => {
  it('fails the BAD router on "no-redirect-loop" (A⇄B storm — escape documenso:849885b5)', async () => {
    const target = await loopStatus('two-cycle');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD router with no false alarm (other nav criteria are not applicable by seam)', async () => {
    const v = await verify(navigationIntegrity, loop('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
    expect(v.results.find((r) => r.criterionId === 'target-resolves')?.status).toBe('not-applicable');
  });

  it('emits the no-redirect-loop number', async () => {
    const detected = (await loopStatus('two-cycle'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await loopStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP] navigation no-redirect-loop detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for no-redirect-loop — distinct loop topologies (a 2-node cycle, a
 * 3-node cycle, an always-redirect route). A robust criterion kills every one while
 * leaving the fixed-point GOOD router green.
 */
const MUTANTS: readonly LoopVariant[] = ['two-cycle', 'three-cycle', 'always-redirect'];

describe('AVP — mutation testing (navigation-integrity · no-redirect-loop)', () => {
  it('kills every redirect-loop mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await loopStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await loopStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP mutation] navigation-integrity · no-redirect-loop: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the fixed-point router').toBe(false);
  });
});
