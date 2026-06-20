import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { verifyHttp } from '../src/adapter-http/verify';
import { integrationIntegrity } from '../src/archetypes/integration-integrity';
import type { HttpIntegrationSubject } from '../src/adapter-http/subject';
import { startCallbackServer, type CallbackVariant } from './dataset/callback-server';

/**
 * integration-integrity · callback-resolves-entity — backend, over HTTP. A callback
 * that can't be tied to a domain entity (missing/unknown charge id) must be refused,
 * not accepted-and-misapplied. A resolvable callback still succeeds. Faithful escape
 * (a webhook arriving without the charge id); confirmed cross-stack in Node/TS by
 * documenso's "include envelopeId in webhook payload". Shares the integration
 * archetype with webhook-signature-verified + redirect-urls-bound, gated by seam.
 */
const servers: Partial<Record<CallbackVariant, Awaited<ReturnType<typeof startCallbackServer>>>> = {};
const VARIANTS: readonly CallbackVariant[] = ['good', 'no-validation', 'default-entity', 'ignored-lookup', 'loose-gate'];

beforeAll(async () => {
  for (const v of VARIANTS) servers[v] = await startCallbackServer(v);
});
afterAll(async () => {
  await Promise.all(VARIANTS.map((v) => servers[v]?.close()));
});

// unresolvable: a payment callback with NO chargeId. resolvable: a known charge.
const callback = (baseUrl: string): HttpIntegrationSubject => ({
  name: 'payment-callback',
  unresolvable: { method: 'POST', url: `${baseUrl}/webhooks/payment`, body: { status: 'paid' } },
  resolvable: { method: 'POST', url: `${baseUrl}/webhooks/payment`, body: { chargeId: 'ch_1', status: 'paid' } },
});

const resolveStatus = async (variant: CallbackVariant) => {
  const v = await verifyHttp(integrationIntegrity, callback(servers[variant]!.baseUrl));
  return v.results.find((r) => r.criterionId === 'callback-resolves-entity');
};

describe('AVP — verifier accuracy (integration-integrity · callback-resolves-entity, HTTP adapter)', () => {
  it('fails the BAD backend on "callback-resolves-entity" (accepts an unresolvable callback — escape documenso:a99bdf5e)', async () => {
    const target = await resolveStatus('no-validation');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD backend with no false alarm (webhook/checkout criteria skipped by seam)', async () => {
    const v = await verifyHttp(integrationIntegrity, callback(servers.good!.baseUrl));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
    expect(v.results.find((r) => r.criterionId === 'webhook-signature-verified')?.status).toBe('skipped');
  });

  it('sanity: the GOOD server refuses the no-chargeId callback (422) but accepts ch_1', async () => {
    const bad = await fetch(`${servers.good!.baseUrl}/webhooks/payment`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'paid' }),
    });
    expect(bad.status).toBe(422);
    const okRes = await fetch(`${servers.good!.baseUrl}/webhooks/payment`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chargeId: 'ch_1', status: 'paid' }),
    });
    expect(okRes.status).toBe(200);
  });

  it('emits the callback-resolves-entity (HTTP) number', async () => {
    const detected = (await resolveStatus('no-validation'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await resolveStatus('good'))?.status === 'fail' ? 1 : 0;
    // eslint-disable-next-line no-console
    console.log(`\n[AVP] integration-integrity · callback-resolves-entity (HTTP adapter) detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for callback-resolves-entity — distinct ways a server accepts a
 * callback it can't resolve (no validation, a default-entity fallback, an ignored
 * lookup, a loose truthiness gate). A robust criterion kills every one while leaving
 * the resolving GOOD server green.
 */
const MUTANTS: readonly CallbackVariant[] = ['no-validation', 'default-entity', 'ignored-lookup', 'loose-gate'];

describe('AVP — mutation testing (integration-integrity · callback-resolves-entity)', () => {
  it('kills every unresolvable-accept mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await resolveStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await resolveStatus('good'))?.status === 'fail';
    // eslint-disable-next-line no-console
    console.log(
      `\n[AVP mutation] integration-integrity · callback-resolves-entity: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the resolving server').toBe(false);
  });
});
