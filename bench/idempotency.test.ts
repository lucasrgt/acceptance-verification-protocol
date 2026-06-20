import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { verifyHttp } from '../src/adapter-http/verify';
import { requestIdempotency } from '../src/archetypes/request-idempotency';
import type { HttpIdempotencySubject } from '../src/adapter-http/subject';
import { startIdempotencyServer, type IdempotencyVariant } from './dataset/idempotency-server';

/**
 * request-idempotency · idempotency-key-honored — backend, over HTTP. The server
 * counterpart of action-effect's single-flight (which guards the client button): a
 * mutation carrying an idempotency key must be applied at most once, so a retried /
 * duplicated request does not create a second resource. Faithful escapes: cal.com
 * "Prevent duplicate bookings with idempotency key" (d85e0b51), documenso "rework
 * stripe webhooks into idempotent subscription sync" (3887aa67).
 */
const VARIANTS: readonly IdempotencyVariant[] = ['good', 'no-idempotency', 'key-in-body', 'dedup-all', 'expires-now'];
const servers = new Map<IdempotencyVariant, Awaited<ReturnType<typeof startIdempotencyServer>>>();

beforeAll(async () => {
  for (const v of VARIANTS) servers.set(v, await startIdempotencyServer(v));
});
afterAll(async () => {
  for (const s of servers.values()) await s.close();
});

const subject = (variant: IdempotencyVariant): HttpIdempotencySubject => ({
  name: `idempotency-${variant}`,
  createWithKey: (key) => ({
    method: 'POST',
    url: `${servers.get(variant)!.baseUrl}/resources`,
    headers: { 'Idempotency-Key': key },
    body: { name: 'x' },
  }),
  readId: (b) => (b as { id?: string | number }).id ?? null,
});

const idemStatus = async (variant: IdempotencyVariant) => {
  const v = await verifyHttp(requestIdempotency, subject(variant));
  return v.results.find((r) => r.criterionId === 'idempotency-key-honored');
};

describe('AVP — verifier accuracy (request-idempotency, HTTP adapter)', () => {
  it('fails the BAD backend on "idempotency-key-honored" (duplicate on repeat — escape calcom:d85e0b51)', async () => {
    const target = await idemStatus('no-idempotency');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD backend with no false alarm (same key replays, new key mints)', async () => {
    const v = await verifyHttp(requestIdempotency, subject('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the request-idempotency (HTTP) number', async () => {
    const detected = (await idemStatus('no-idempotency'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await idemStatus('good'))?.status === 'fail' ? 1 : 0;
    // eslint-disable-next-line no-console
    console.log(`\n[AVP] request-idempotency (HTTP adapter) detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for idempotency-key-honored — distinct ways a server fails to honor
 * the key: ignoring it (duplicate), looking for it in the wrong place (never dedups),
 * deduping regardless of the key (distinct ops collide), and not durably persisting it
 * (never replays). A robust criterion kills every one while leaving the correct server
 * green.
 */
const MUTANTS: readonly IdempotencyVariant[] = ['no-idempotency', 'key-in-body', 'dedup-all', 'expires-now'];

describe('AVP — mutation testing (request-idempotency · idempotency-key-honored)', () => {
  it('kills every broken-idempotency mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await idemStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await idemStatus('good'))?.status === 'fail';
    // eslint-disable-next-line no-console
    console.log(
      `\n[AVP mutation] request-idempotency · idempotency-key-honored: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the idempotent server').toBe(false);
  });
});
