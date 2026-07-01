import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { verifyHttp } from '../src/adapter-http/verify';
import { authorization } from '../src/archetypes/authorization';
import type { HttpAuthSubject } from '../src/adapter-http/subject';
import { startAuthorityServer, CATALOG, type AuthorityVariant } from './dataset/authority-server';

/**
 * authorization · server-is-authoritative — backend, over HTTP. The server must
 * record its own truth (the catalog price), never the client's word for it. The
 * probe writes the SAME order several times with different tampered prices; a
 * correct server records the catalog price every time. Faithful escape (marketplace
 * recorded the client-sent terms version); confirmed cross-stack in .NET by
 * bitwarden's altered-value-saved fix. Shares the authorization archetype with
 * own-resource-only + role-required, gated by seam.
 */
const servers: Partial<Record<AuthorityVariant, Awaited<ReturnType<typeof startAuthorityServer>>>> = {};
const VARIANTS: readonly AuthorityVariant[] = ['good', 'echo', 'min', 'fallback', 'clamp', 'average'];

beforeAll(async () => {
  for (const v of VARIANTS) servers[v] = await startAuthorityServer(v);
});
afterAll(async () => {
  await Promise.all(VARIANTS.map((v) => servers[v]?.close()));
});

// Same item, three different client-tampered prices — the server's record must not move.
const tamperedWrites = (baseUrl: string): HttpAuthSubject => ({
  name: 'record-order-price',
  writes: [1, 999999, 5000].map((priceCents) => ({
    method: 'POST',
    url: `${baseUrl}/orders`,
    body: { itemId: 'sku-1', priceCents },
  })),
  readRecorded: (body) => (body as { recordedPriceCents: number }).recordedPriceCents,
  serverTruth: CATALOG['sku-1'],
});

const authorityStatus = async (variant: AuthorityVariant) => {
  const v = await verifyHttp(authorization, tamperedWrites(servers[variant]!.baseUrl));
  return v.results.find((r) => r.criterionId === 'server-is-authoritative');
};

describe('AVP — verifier accuracy (authorization · server-is-authoritative, HTTP adapter)', () => {
  it('fails the BAD backend on "server-is-authoritative" (records client price — escape bitwarden:ae5508d14)', async () => {
    const target = await authorityStatus('echo');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD backend with no false alarm (ownership/role criteria skipped by seam)', async () => {
    const v = await verifyHttp(authorization, tamperedWrites(servers.good!.baseUrl));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
    expect(v.results.find((r) => r.criterionId === 'own-resource-only')?.status).toBe('skipped');
  });

  it('sanity: the GOOD server records the catalog price regardless of the client price', async () => {
    const res = await fetch(`${servers.good!.baseUrl}/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ itemId: 'sku-1', priceCents: 1 }),
    });
    const { recordedPriceCents } = (await res.json()) as { recordedPriceCents: number };
    expect(recordedPriceCents).toBe(10000); // not the client's 1 cent
  });

  it('emits the server-is-authoritative (HTTP) number', async () => {
    const detected = (await authorityStatus('echo'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await authorityStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP] authorization · server-is-authoritative (HTTP adapter) detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for server-is-authoritative — distinct ways a client value leaks
 * into what the server records (full echo, cheaper-price-wins, fallback, clamp,
 * average). A robust criterion kills every one while leaving the authoritative GOOD
 * server green.
 */
const MUTANTS: readonly AuthorityVariant[] = ['echo', 'min', 'fallback', 'clamp', 'average'];

describe('AVP — mutation testing (authorization · server-is-authoritative)', () => {
  it('kills every trust-the-client mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await authorityStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await authorityStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP mutation] authorization · server-is-authoritative: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the authoritative server').toBe(false);
  });
});
