import { AvpFail, type Probe } from '../core/dsl';
import type { IdempotencyExpect } from '../archetypes/request-idempotency';
import type { VerifyHooks } from '../core/run';
import type { HttpIdempotencySubject, HttpRequestSpec } from './subject';

async function fetchJson(r: HttpRequestSpec): Promise<unknown> {
  const res = await fetch(r.url, {
    method: r.method,
    headers: { 'content-type': 'application/json', ...(r.headers ?? {}) },
    body: r.body !== undefined ? JSON.stringify(r.body) : undefined,
  });
  return res.json().catch(() => ({}));
}

/**
 * The HTTP adapter's `request-idempotency` probe. Fires the create twice with the
 * SAME key — they must resolve to one resource (the original, replayed) — and once
 * with a DIFFERENT key — which must be a distinct resource (the dedup is scoped to the
 * key). A server that ignores the key duplicates; a server that dedups regardless of
 * the key collides distinct operations. Both are caught.
 */
export function idempotencyProbe(subject: HttpIdempotencySubject): Probe<IdempotencyExpect> {
  let id1: string | number | null = null;
  let id2: string | number | null = null;
  let id3: string | number | null = null;
  let acted = false;

  return {
    async act() {
      id1 = subject.readId(await fetchJson(subject.createWithKey('idem-key-A')));
      id2 = subject.readId(await fetchJson(subject.createWithKey('idem-key-A'))); // same key — a repeat
      id3 = subject.readId(await fetchJson(subject.createWithKey('idem-key-B'))); // different key — distinct op
      acted = true;
    },
    expect: {
      idempotencyKeyHonored() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (id1 === null || id2 === null) {
          throw new AvpFail('No resource id in the create response — cannot verify idempotency. Return the created id so a repeat can be matched.', { id1, id2 });
        }
        if (id1 !== id2) {
          throw new AvpFail(
            `Two requests with the SAME idempotency key created two resources (${id1} ≠ ${id2}) — a duplicate effect. Persist the key and replay the original result on a repeat; don't re-create.`,
            { id1, id2 },
          );
        }
        if (id3 === id1) {
          throw new AvpFail(
            `A request with a DIFFERENT key returned the same resource (${id3}) — the server dedups regardless of the key, so distinct operations collide. Scope the dedup to the idempotency key.`,
            { id1, id3 },
          );
        }
      },
    },
  };
}

export function idempotencyHooks(subject: HttpIdempotencySubject): VerifyHooks {
  return { probe: () => idempotencyProbe(subject) };
}
