import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { verifyHttp } from '../src/adapter-http/verify';
import { secondOrderEffects } from '../src/archetypes/second-order-effects';
import type { HttpNotifySubject } from '../src/adapter-http/subject';
import { startNotifyServer } from './dataset/notify-server';

/**
 * second-order-effects · notifies-all-parties — backend, over HTTP. Accepting a
 * booking must notify BOTH the host and the traveler. The largest backend cluster
 * in the corpus.
 */
let bad: Awaited<ReturnType<typeof startNotifyServer>>;
let good: Awaited<ReturnType<typeof startNotifyServer>>;

beforeAll(async () => {
  bad = await startNotifyServer('bad');
  good = await startNotifyServer('good');
});
afterAll(async () => {
  await bad.close();
  await good.close();
});

const booking = (baseUrl: string): HttpNotifySubject => ({
  name: 'booking-accept',
  trigger: { method: 'POST', url: `${baseUrl}/bookings/b1/accept` },
  inboxes: [
    { party: 'host', url: `${baseUrl}/inbox/host` },
    { party: 'traveler', url: `${baseUrl}/inbox/traveler` },
  ],
});

describe('AVP — verifier accuracy (second-order-effects, HTTP adapter)', () => {
  it('fails the BAD backend on "notifies-all-parties" (escape 81c919ed)', async () => {
    const v = await verifyHttp(secondOrderEffects, booking(bad.baseUrl));
    const target = v.results.find((r) => r.criterionId === 'notifies-all-parties');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD backend with no false alarm', async () => {
    const v = await verifyHttp(secondOrderEffects, booking(good.baseUrl));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the second-order-effects (HTTP) number', async () => {
    const b = await verifyHttp(secondOrderEffects, booking(bad.baseUrl));
    const g = await verifyHttp(secondOrderEffects, booking(good.baseUrl));
    const detected = b.results.find((r) => r.criterionId === 'notifies-all-parties')?.status === 'fail' ? 1 : 0;
    const falseAlarms = g.results.some((r) => r.status === 'fail') ? 1 : 0;
     
    console.log(`\n[AVP] second-order-effects (HTTP adapter) detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});
