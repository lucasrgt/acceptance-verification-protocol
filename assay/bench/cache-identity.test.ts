import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { actionEffect } from '../src/archetypes/action-effect';
import type { IdentitySubject } from '../src/adapter-react/identity';
import { buildIdentityApp, type IdentityVariant } from './dataset/identity-app';

/**
 * action-effect · cache-cleared-on-identity (identity flow). After signing out of A
 * and into B, the UI must show B's rows — never A's cached rows. A stale-cache leak
 * across identity is a privacy/security escape. Faithful escape (a prior account's
 * rows feeding the new session); confirmed cross-stack by documenso's "invalidate
 * sessions" / "clear cache" fixes. Shares the action-effect archetype with the seven
 * action criteria, gated by subject shape.
 */
const identity = (variant: IdentityVariant): IdentitySubject => ({
  name: `identity-${variant}`,
  render: buildIdentityApp(variant),
  endpoint: { method: 'GET', path: 'http://localhost/api/me/items' },
  responsesByUser: {
    A: [{ id: 'a1', label: 'Alice trip' }],
    B: [{ id: 'b1', label: 'Bob trip' }],
  },
  switchControl: { role: 'button', name: /switch account/i },
  priorMarker: /Alice trip/i,
  nextMarker: /Bob trip/i,
});

const identityStatus = async (variant: IdentityVariant) => {
  const v = await verify(actionEffect, identity(variant));
  return v.results.find((r) => r.criterionId === 'cache-cleared-on-identity');
};

describe('AVP — verifier accuracy (action-effect · cache-cleared-on-identity)', () => {
  it('fails the BAD app on "cache-cleared-on-identity" (prior account rows leak — escape documenso:8fca029d)', async () => {
    const target = await identityStatus('stale-cache');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD app with no false alarm (action criteria skipped by shape)', async () => {
    const v = await verify(actionEffect, identity('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
    expect(v.results.find((r) => r.criterionId === 'fires-primary-effect')?.status).toBe('skipped');
  });

  it('emits the cache-cleared-on-identity number', async () => {
    const detected = (await identityStatus('stale-cache'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await identityStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP] action-effect cache-cleared-on-identity detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for cache-cleared-on-identity — distinct ways a prior identity's
 * rows survive the switch (a constant cache key, no refetch on switch, a fetch that
 * still claims the old identity). A robust criterion kills every one while leaving
 * the cache-clearing GOOD app green.
 */
const MUTANTS: readonly IdentityVariant[] = ['stale-cache', 'no-refetch', 'stale-identity'];

describe('AVP — mutation testing (action-effect · cache-cleared-on-identity)', () => {
  it('kills every cross-identity cache leak + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await identityStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await identityStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP mutation] action-effect · cache-cleared-on-identity: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the cache-clearing app').toBe(false);
  });
});
