import type { HttpRequestSpec } from './subject';

/**
 * The ONE place the HTTP adapter touches the wire. Every probe sends through these
 * helpers, so timeout policy, JSON handling, and refusal semantics live here once.
 */

/** Per-request deadline. A hung server must fail the criterion, never hang the verification. */
const TIMEOUT_MS = Number(process.env.ASSAY_HTTP_TIMEOUT_MS ?? '10000') || 10000;

// Under a DOM-ish host (jsdom bench) fetch is proxied by MSW, whose undici Request
// rejects AbortSignals minted in the jsdom realm — so there the deadline is a race
// (bounded wait, no cancellation). In a plain Node host (the real backend-verification
// path) a native AbortSignal gives true request cancellation.
const domRealm = typeof window !== 'undefined';

function withDeadline(p: Promise<Response>, what: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`assay: ${what} timed out after ${TIMEOUT_MS}ms — a hung endpoint fails the criterion, it never hangs the verification.`)),
      TIMEOUT_MS,
    );
    (timer as { unref?: () => void }).unref?.();
    p.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

function doFetch(r: HttpRequestSpec): Promise<Response> {
  const init: RequestInit = {
    method: r.method,
    headers: { 'content-type': 'application/json', ...(r.headers ?? {}) },
    body: r.body !== undefined ? JSON.stringify(r.body) : undefined,
  };
  if (!domRealm) init.signal = AbortSignal.timeout(TIMEOUT_MS);
  const request = fetch(r.url, init);
  return domRealm ? withDeadline(request, `${r.method} ${r.url}`) : request;
}

/** Fires the request and returns the status code. */
export async function sendStatus(r: HttpRequestSpec): Promise<number> {
  return (await doFetch(r)).status;
}

export interface JsonReply {
  readonly status: number;
  readonly body: unknown;
  /** Present when the body was not parseable JSON — kept as evidence, never swallowed. */
  readonly parseError?: string;
}

/** Fires the request and returns status + parsed body (parse failure is evidence, not `{}`). */
export async function sendJson(r: HttpRequestSpec): Promise<JsonReply> {
  const res = await doFetch(r);
  const raw = await res.text();
  if (raw.trim() === '') return { status: res.status, body: undefined };
  try {
    return { status: res.status, body: JSON.parse(raw) };
  } catch (e) {
    return { status: res.status, body: raw, parseError: (e as Error).message };
  }
}

export const ok = (s: number | null): boolean => s !== null && s >= 200 && s < 300;

/**
 * A correct REFUSAL: a deliberate client-error rejection. `rejectWith` narrows to the
 * subject's canonical statuses; without it any 4xx counts. A 5xx is NEVER a refusal —
 * a crash is the endpoint failing, not the endpoint protecting the resource.
 */
export function refused(status: number | null, rejectWith?: readonly number[]): boolean {
  if (status === null) return false;
  if (rejectWith) return rejectWith.includes(status);
  return status >= 400 && status < 500;
}

/** Structural equality (key-order independent) — for comparing recorded values to server truth. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  return ka.every((k) =>
    deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
  );
}
