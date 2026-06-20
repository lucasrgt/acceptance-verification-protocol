import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { verifyHttp } from '../src/adapter-http/verify';
import { lifecycleGate } from '../src/archetypes/lifecycle-gate';
import type { HttpLifecycleSubject } from '../src/adapter-http/subject';
import { startLifecycleServer, type LifecycleVariant } from './dataset/lifecycle-server';

/**
 * lifecycle-gate · gate-enforced-server-side — the FIRST executed lifecycle-gate
 * criterion, over real HTTP. A transition (publish) on a resource whose precondition
 * is unmet must be refused server-side; a ready resource's transition still
 * succeeds. Faithful escape (the marketplace's go-live gated only client-side);
 * confirmed cross-stack by documenso's "prevent signing draft documents" and
 * bitwarden's prevent-non-confirmed-SSO-users.
 */
const servers: Partial<Record<LifecycleVariant, Awaited<ReturnType<typeof startLifecycleServer>>>> = {};
const VARIANTS: readonly LifecycleVariant[] = ['good', 'no-check', 'trust-client-flag', 'check-complete-only', 'or-not-and'];

beforeAll(async () => {
  for (const v of VARIANTS) servers[v] = await startLifecycleServer(v);
});
afterAll(async () => {
  await Promise.all(VARIANTS.map((v) => servers[v]?.close()));
});

// Publish draft-1 (precondition unmet) — even with the client lying `ready:true`.
// whenReady: publish ready-1 (precondition met) — must succeed.
const publish = (baseUrl: string): HttpLifecycleSubject => ({
  name: 'publish-listing',
  transition: { method: 'POST', url: `${baseUrl}/listings/draft-1/publish`, body: { ready: true } },
  whenReady: { method: 'POST', url: `${baseUrl}/listings/ready-1/publish`, body: {} },
});

const gateStatus = async (variant: LifecycleVariant) => {
  const v = await verifyHttp(lifecycleGate, publish(servers[variant]!.baseUrl));
  return v.results.find((r) => r.criterionId === 'gate-enforced-server-side');
};

describe('AVP — verifier accuracy (lifecycle-gate · gate-enforced-server-side, HTTP adapter)', () => {
  it('fails the BAD backend on "gate-enforced-server-side" (client-only gate — escape documenso:6e09a470)', async () => {
    const target = await gateStatus('no-check');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD backend with no false alarm', async () => {
    const v = await verifyHttp(lifecycleGate, publish(servers.good!.baseUrl));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('sanity: the GOOD server refuses a direct publish of the unready draft (422)', async () => {
    const res = await fetch(`${servers.good!.baseUrl}/listings/draft-1/publish`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ready: true }),
    });
    expect(res.status).toBe(422); // the client's `ready:true` is ignored
  });

  it('emits the lifecycle-gate (HTTP) number', async () => {
    const detected = (await gateStatus('no-check'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await gateStatus('good'))?.status === 'fail' ? 1 : 0;
    // eslint-disable-next-line no-console
    console.log(`\n[AVP] lifecycle-gate · gate-enforced-server-side (HTTP adapter) detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for gate-enforced-server-side — distinct ways the server fails to
 * enforce the precondition (no check, trusting a client flag, checking the wrong
 * field, the wrong boolean). A robust criterion kills every one while leaving the
 * enforcing GOOD server green.
 */
const MUTANTS: readonly LifecycleVariant[] = ['no-check', 'trust-client-flag', 'check-complete-only', 'or-not-and'];

describe('AVP — mutation testing (lifecycle-gate · gate-enforced-server-side)', () => {
  it('kills every client-only-gate mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await gateStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await gateStatus('good'))?.status === 'fail';
    // eslint-disable-next-line no-console
    console.log(
      `\n[AVP mutation] lifecycle-gate · gate-enforced-server-side: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the enforcing server').toBe(false);
  });
});
