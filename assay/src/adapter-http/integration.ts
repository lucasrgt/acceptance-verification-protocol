import { AvpFail, type Probe } from '../core/dsl';
import type { IntegrationExpect } from '../archetypes/integration-integrity';
import type { VerifyHooks } from '../core/run';
import type { HttpIntegrationSubject, ReturnTransition } from './subject';
import { ok, sendJson, sendStatus } from './wire';

/** Hosts that mean "not bound to a real environment" — a dev/placeholder return URL. */
const PLACEHOLDER_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'example.com',
  'example.org',
  'example.net',
  'your-domain.com',
  'changeme',
]);

/** Returns why a return URL is unbound, or null when it's a real, absolute, bound URL. */
function urlProblem(raw: string | null | undefined, expectedOrigin?: string): string | null {
  if (raw == null || raw === '') return 'is missing/empty';
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return `is not an absolute URL ("${raw}") — a provider can't redirect to a relative path`;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return `is not http(s) ("${raw}")`;
  if (PLACEHOLDER_HOSTS.has(u.hostname)) return `points at a placeholder/dev host ("${u.hostname}")`;
  if (expectedOrigin && u.origin !== expectedOrigin) return `is not bound to the app origin (${u.origin} ≠ ${expectedOrigin})`;
  return null;
}

/**
 * The HTTP adapter's `integration-integrity` probe — two seams, each driven only
 * when the subject declares it: the webhook signature check and the checkout
 * return-URL binding check.
 */
export function integrationProbe(subject: HttpIntegrationSubject): Probe<IntegrationExpect> {
  let forged: number | null = null;
  let valid: number | null = null;
  let returnUrls: Partial<Record<ReturnTransition, string | null | undefined>> | null = null;
  let unresolvable: number | null = null;
  let resolvable: number | null = null;
  let beforeEvents: readonly string[] | null = null;
  let afterEvents: readonly string[] | null = null;

  return {
    async act() {
      if (subject.forged) forged = await sendStatus(subject.forged);
      if (subject.valid) valid = await sendStatus(subject.valid);
      if (subject.state && subject.readAppliedEventIds) {
        beforeEvents = subject.readAppliedEventIds((await sendJson(subject.state)).body);
      }
      if (subject.stateValid) await sendStatus(subject.stateValid);
      if (subject.stateForged) await sendStatus(subject.stateForged);
      if (subject.state && subject.readAppliedEventIds) {
        afterEvents = subject.readAppliedEventIds((await sendJson(subject.state)).body);
      }
      if (subject.checkout) {
        const reply = await sendJson(subject.checkout);
        if (reply.parseError) {
          throw new AvpFail(
            `The checkout response body is not parseable JSON (${reply.parseError}) — the return URLs cannot be read.`,
            { status: reply.status, body: reply.body },
          );
        }
        returnUrls = subject.readReturnUrls ? subject.readReturnUrls(reply.body) : {};
      }
      if (subject.unresolvable) unresolvable = await sendStatus(subject.unresolvable);
      if (subject.resolvable) resolvable = await sendStatus(subject.resolvable);
    },
    expect: {
      webhookSignatureVerified() {
        if (forged === null) throw new AvpFail('probe used before act() — no webhook declared.');
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
      webhookEffectsState() {
        if (!beforeEvents || !afterEvents || !subject.validEventId || !subject.forgedEventId) {
          throw new AvpFail('probe used without a complete webhook state seam.');
        }
        const count = (events: readonly string[], id: string) => events.filter((event) => event === id).length;
        const validDelta = count(afterEvents, subject.validEventId) - count(beforeEvents, subject.validEventId);
        const forgedDelta = count(afterEvents, subject.forgedEventId) - count(beforeEvents, subject.forgedEventId);
        if (validDelta !== 1 || forgedDelta !== 0) {
          throw new AvpFail(
            `Webhook state is not authentic-only: valid event delta=${validDelta} (expected 1), forged event delta=${forgedDelta} (expected 0). Observe effects, not only response codes.`,
            { beforeEvents, afterEvents, validEventId: subject.validEventId, forgedEventId: subject.forgedEventId },
          );
        }
      },
      redirectUrlsBound() {
        if (returnUrls === null) throw new AvpFail('probe used before act() — no checkout declared.');
        const required = subject.requiredTransitions ?? ['success', 'failure'];
        const unbound: string[] = [];
        for (const t of required) {
          const problem = urlProblem(returnUrls[t], subject.expectedOrigin);
          if (problem) unbound.push(`${t} ${problem}`);
        }
        if (unbound.length > 0) {
          throw new AvpFail(
            `Checkout/OAuth return URL(s) not bound to a real environment: ${unbound.join('; ')}. Bind every required transition to the configured app origin (absolute https), never a placeholder, relative path, or dev host.`,
            { returnUrls, required },
          );
        }
      },
      callbackResolvesEntity() {
        if (unresolvable === null) throw new AvpFail('probe used before act() — no unresolvable callback declared.');
        if (ok(unresolvable)) {
          throw new AvpFail(
            `A callback that can't be tied to a domain entity (missing/unknown reference) was accepted (${unresolvable}) — the event is silently dropped or applied to the wrong entity. Resolve the reference and refuse (422) when it doesn't map to a known entity.`,
            { unresolvable },
          );
        }
        if (resolvable !== null && !ok(resolvable)) {
          throw new AvpFail(
            `A callback that DOES resolve to a real entity was refused (${resolvable}) — the endpoint rejects everything, not only unresolvable callbacks. Accept callbacks that carry a valid reference.`,
            { resolvable },
          );
        }
      },
    },
  };
}

export function webhookHooks(subject: HttpIntegrationSubject): VerifyHooks {
  return {
    probe: () => integrationProbe(subject),
    applies: (c) => {
      if (c.requires === 'webhook' && !subject.forged) return 'Subject declares no webhook — not applicable.';
      if (c.requires === 'webhook-state' && (!subject.stateValid || !subject.stateForged || !subject.state || !subject.readAppliedEventIds)) {
        return 'Subject declares no observable webhook state seam — not applicable.';
      }
      if (c.requires === 'checkout' && !subject.checkout) return 'Subject declares no checkout request — not applicable.';
      if (c.requires === 'resolve' && !subject.unresolvable) return 'Subject declares no unresolvable callback — not applicable.';
      return null;
    },
  };
}
