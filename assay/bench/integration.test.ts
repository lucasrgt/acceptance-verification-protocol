import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { verifyHttp } from '../src/adapter-http/verify';
import { integrationIntegrity } from '../src/archetypes/integration-integrity';
import type { HttpIntegrationSubject } from '../src/adapter-http/subject';
import { startWebhookServer, sign } from './dataset/webhook-server';

/**
 * integration-integrity · webhook-signature-verified — backend, over HTTP. A
 * forged-signature webhook must be refused; a correctly-signed one accepted.
 */
let bad: Awaited<ReturnType<typeof startWebhookServer>>;
let good: Awaited<ReturnType<typeof startWebhookServer>>;
let stateGood: Awaited<ReturnType<typeof startWebhookServer>>;
let stateBad: Awaited<ReturnType<typeof startWebhookServer>>;

beforeAll(async () => {
  bad = await startWebhookServer('bad');
  good = await startWebhookServer('good');
  stateGood = await startWebhookServer('state-good-200');
  stateBad = await startWebhookServer('state-bad-200');
});
afterAll(async () => {
  await bad.close();
  await good.close();
  await stateGood.close();
  await stateBad.close();
});

const payload = { chargeId: 'ch_1', status: 'paid' };
const body = JSON.stringify(payload);

const webhook = (baseUrl: string): HttpIntegrationSubject => ({
  name: 'payment-webhook',
  forged: { method: 'POST', url: `${baseUrl}/webhooks/payment`, headers: { 'x-signature': 'forged-deadbeef' }, body: payload },
  valid: { method: 'POST', url: `${baseUrl}/webhooks/payment`, headers: { 'x-signature': sign(body) }, body: payload },
});

const stateWebhook = (baseUrl: string): HttpIntegrationSubject => {
  const validEvent = { id: 'evt-valid', status: 'paid' };
  const forgedEvent = { id: 'evt-forged', status: 'paid' };
  return {
    name: 'payment-webhook-state',
    stateValid: {
      method: 'POST',
      url: `${baseUrl}/webhooks/payment`,
      headers: { 'x-signature': sign(JSON.stringify(validEvent)) },
      body: validEvent,
    },
    stateForged: {
      method: 'POST',
      url: `${baseUrl}/webhooks/payment`,
      headers: { 'x-signature': 'forged-deadbeef' },
      body: forgedEvent,
    },
    state: { method: 'GET', url: `${baseUrl}/events` },
    readAppliedEventIds: (value) => value as string[],
    validEventId: validEvent.id,
    forgedEventId: forgedEvent.id,
  };
};

describe('AVP — verifier accuracy (integration-integrity, HTTP adapter)', () => {
  it('fails the BAD backend on "webhook-signature-verified" (escape 692d85af)', async () => {
    const v = await verifyHttp(integrationIntegrity, webhook(bad.baseUrl));
    const target = v.results.find((r) => r.criterionId === 'webhook-signature-verified');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD backend with no false alarm', async () => {
    const v = await verifyHttp(integrationIntegrity, webhook(good.baseUrl));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the integration-integrity (HTTP) number', async () => {
    const b = await verifyHttp(integrationIntegrity, webhook(bad.baseUrl));
    const g = await verifyHttp(integrationIntegrity, webhook(good.baseUrl));
    const detected = b.results.find((r) => r.criterionId === 'webhook-signature-verified')?.status === 'fail' ? 1 : 0;
    const falseAlarms = g.results.some((r) => r.status === 'fail') ? 1 : 0;
     
    console.log(`\n[AVP] integration-integrity (HTTP adapter) detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

describe('AVP — verifier accuracy (integration-integrity · webhook-effects-state)', () => {
  it('fails the BAD 200-always backend when a forged event mutates state', async () => {
    const verdict = await verifyHttp(integrationIntegrity, stateWebhook(stateBad.baseUrl));
    expect(verdict.results.find((result) => result.criterionId === 'webhook-effects-state')?.status).toBe('fail');
  });

  it('passes the GOOD 200-always backend when only the authentic event changes state', async () => {
    const verdict = await verifyHttp(integrationIntegrity, stateWebhook(stateGood.baseUrl));
    expect(verdict.results.find((result) => result.criterionId === 'webhook-effects-state')?.status).toBe('pass');
  });

  it('emits the webhook state accuracy number', async () => {
    const badVerdict = await verifyHttp(integrationIntegrity, stateWebhook(stateBad.baseUrl));
    const goodVerdict = await verifyHttp(integrationIntegrity, stateWebhook(stateGood.baseUrl));
    const detected = badVerdict.results.find((result) => result.criterionId === 'webhook-effects-state')?.status === 'fail' ? 1 : 0;
    const falseAlarms = goodVerdict.results.find((result) => result.criterionId === 'webhook-effects-state')?.status === 'fail' ? 1 : 0;
    console.log(`\n[AVP] integration-integrity webhook-effects-state detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});
