import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { navigationIntegrity } from '../src/archetypes/navigation-integrity';
import type { RouterNavSubject } from '../src/adapter-react/navigation-router';
import { buildParamRouter, type ParamVariant } from './dataset/param-route';

/**
 * navigation-integrity · required-params-guarded (router-mounted). A route that
 * needs a param, opened without it, must redirect to a real parent (Inbox) — never
 * render the detail with an undefined/empty param (a ghost "Conversation" screen).
 * Faithful escape (the marketplace's param-less chat thread); confirmed cross-stack
 * in Node/TS by documenso's "guard missing reset token / broken link URL" fix.
 */
const paramGuard = (variant: ParamVariant): RouterNavSubject => ({
  name: `param-${variant}`,
  router: buildParamRouter(variant),
  paramGuard: { fallbackMarker: /Inbox/i, ghostMarker: /Conversation/i },
});

const guardStatus = async (variant: ParamVariant) => {
  const v = await verify(navigationIntegrity, paramGuard(variant));
  return v.results.find((r) => r.criterionId === 'required-params-guarded');
};

describe('AVP — verifier accuracy (navigation-integrity · required-params-guarded)', () => {
  it('fails the BAD router on "required-params-guarded" (ghost — escape documenso:184cbd67)', async () => {
    const target = await guardStatus('no-guard');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD router with no false alarm (other nav criteria skipped by seam)', async () => {
    const v = await verify(navigationIntegrity, paramGuard('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
    expect(v.results.find((r) => r.criterionId === 'target-resolves')?.status).toBe('skipped');
  });

  it('emits the required-params-guarded number', async () => {
    const detected = (await guardStatus('no-guard'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await guardStatus('good'))?.status === 'fail' ? 1 : 0;
    // eslint-disable-next-line no-console
    console.log(`\n[AVP] navigation required-params-guarded detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for required-params-guarded — distinct ways a missing param ships
 * a ghost instead of redirecting (no guard at all, an empty ?thread= slipping a
 * `=== undefined` guard, a perpetual spinner, a blank screen). A robust criterion
 * kills every one while leaving the guarded GOOD router green.
 */
const MUTANTS: readonly ParamVariant[] = ['no-guard', 'empty-allowed', 'spinner', 'blank'];

describe('AVP — mutation testing (navigation-integrity · required-params-guarded)', () => {
  it('kills every missing-param ghost mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await guardStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await guardStatus('good'))?.status === 'fail';
    // eslint-disable-next-line no-console
    console.log(
      `\n[AVP mutation] navigation-integrity · required-params-guarded: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the guarded router').toBe(false);
  });
});
