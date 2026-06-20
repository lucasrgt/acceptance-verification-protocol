import { AvpFail, type Probe } from '../core/dsl';
import type { IntegrationExpect } from '../archetypes/integration-integrity';
import type { VerifyHooks } from '../core/run';
import type { HttpRequestSpec, HttpWebhookSubject } from './subject';

async function send(r: HttpRequestSpec): Promise<number> {
  const res = await fetch(r.url, {
    method: r.method,
    headers: { 'content-type': 'application/json', ...(r.headers ?? {}) },
    body: r.body !== undefined ? JSON.stringify(r.body) : undefined,
  });
  return res.status;
}

const ok = (s: number | null) => s !== null && s >= 200 && s < 300;

/** The HTTP adapter's `integration-integrity` probe (webhook signature). */
export function webhookProbe(subject: HttpWebhookSubject): Probe<IntegrationExpect> {
  let forged: number | null = null;
  let valid: number | null = null;
  return {
    async act() {
      forged = await send(subject.forged);
      valid = await send(subject.valid);
    },
    expect: {
      webhookSignatureVerified() {
        if (forged === null) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (ok(forged)) {
          throw new AvpFail(
            `A webhook with a forged/absent signature was accepted (${forged}) — an unauthenticated callback can mutate state. Verify the signature and reject (401) when it doesn't match.`,
            { forged },
          );
        }
        if (!ok(valid)) {
          throw new AvpFail(
            `A correctly-signed webhook was rejected (${valid}) — the endpoint refuses everything, not only forgeries. Accept authentic callbacks.`,
            { valid },
          );
        }
      },
    },
  };
}

export function webhookHooks(subject: HttpWebhookSubject): VerifyHooks {
  return { probe: () => webhookProbe(subject) };
}
