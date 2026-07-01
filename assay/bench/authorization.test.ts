import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { verifyHttp } from '../src/adapter-http/verify';
import { authorization } from '../src/archetypes/authorization';
import type { HttpAuthSubject } from '../src/adapter-http/subject';
import { startIdorServer } from './dataset/idor-server';

/**
 * authorization · own-resource-only — the FIRST backend archetype, verified over
 * real HTTP by the HTTP adapter (no DOM). It reuses the same neutral core runner
 * as the React adapter: DOM and HTTP are just two adapters. Faithful IDOR repro
 * (marketplace 1db3c2fd; the class confirmed in .NET by bitwarden).
 */
let bad: Awaited<ReturnType<typeof startIdorServer>>;
let good: Awaited<ReturnType<typeof startIdorServer>>;

beforeAll(async () => {
  bad = await startIdorServer('bad');
  good = await startIdorServer('good');
});
afterAll(async () => {
  await bad.close();
  await good.close();
});

// As user A, target user B's host (a foreign resource).
const crossAccount = (baseUrl: string): HttpAuthSubject => ({
  name: 'update-host',
  request: { method: 'PUT', url: `${baseUrl}/hosts/host-B`, headers: { 'x-user': 'A' }, body: { cpf: '999' } },
});

// As a non-operator, call the operator-only "list every host".
const privilegedCall = (baseUrl: string): HttpAuthSubject => ({
  name: 'list-all-hosts',
  privileged: { method: 'GET', url: `${baseUrl}/admin/hosts`, headers: { 'x-user': 'A', 'x-role': 'traveler' } },
});

describe('AVP — verifier accuracy (authorization, HTTP adapter)', () => {
  it('fails the BAD backend on "own-resource-only" (IDOR — escape 1db3c2fd)', async () => {
    const v = await verifyHttp(authorization, crossAccount(bad.baseUrl));
    const target = v.results.find((r) => r.criterionId === 'own-resource-only');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD backend with no false alarm', async () => {
    const v = await verifyHttp(authorization, crossAccount(good.baseUrl));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('sanity: the GOOD backend still allows the caller their OWN resource', async () => {
    const res = await fetch(`${good.baseUrl}/hosts/host-A`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'x-user': 'A' },
      body: JSON.stringify({ cpf: '123' }),
    });
    expect(res.status).toBe(200); // not trivially rejecting everything
  });

  it('fails the BAD backend on "role-required" (any-authenticated — escape d36af822)', async () => {
    const v = await verifyHttp(authorization, privilegedCall(bad.baseUrl));
    const target = v.results.find((r) => r.criterionId === 'role-required');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD backend on "role-required" with no false alarm', async () => {
    const v = await verifyHttp(authorization, privilegedCall(good.baseUrl));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the authorization (HTTP) number', async () => {
    const b = await verifyHttp(authorization, crossAccount(bad.baseUrl));
    const g = await verifyHttp(authorization, crossAccount(good.baseUrl));
    const detected = b.results.find((r) => r.criterionId === 'own-resource-only')?.status === 'fail' ? 1 : 0;
    const falseAlarms = g.results.some((r) => r.status === 'fail') ? 1 : 0;
     
    console.log(`\n[AVP] authorization (HTTP adapter) detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});
