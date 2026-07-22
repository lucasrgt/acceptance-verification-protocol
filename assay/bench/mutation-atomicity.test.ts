import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mutationAtomicity } from '../src/archetypes/mutation-atomicity';
import type { HttpMutationAtomicitySubject } from '../src/adapter-http/subject';
import { verifyHttp } from '../src/adapter-http/verify';
import { startMutationServer } from './dataset/mutation-server';

let good: Awaited<ReturnType<typeof startMutationServer>>;
let bad: Awaited<ReturnType<typeof startMutationServer>>;

beforeAll(async () => {
  good = await startMutationServer('good');
  bad = await startMutationServer('bad');
});
afterAll(async () => {
  await good.close();
  await bad.close();
});

const conflict = (baseUrl: string): HttpMutationAtomicitySubject => ({
  name: 'versioned-update',
  conflictingUpdates: [
    { method: 'PUT', url: `${baseUrl}/conflict`, headers: { 'if-match': 'v1' }, body: { value: 'a' } },
    { method: 'PUT', url: `${baseUrl}/conflict`, headers: { 'if-match': 'v1' }, body: { value: 'b' } },
  ],
});

const atomic = (baseUrl: string): HttpMutationAtomicitySubject => ({
  name: 'multi-write-update',
  faultingMutation: { method: 'POST', url: `${baseUrl}/fault`, body: { forceFailure: true } },
  state: { method: 'GET', url: `${baseUrl}/state` },
  readState: (body) => body,
});

async function status(baseUrl: string, subject: HttpMutationAtomicitySubject, criterionId: string) {
  const verdict = await verifyHttp(mutationAtomicity, subject);
  return verdict.results.find((result) => result.criterionId === criterionId)?.status;
}

describe('AVP — verifier accuracy (mutation-atomicity)', () => {
  it.each([
    ['concurrent-conflict-surfaces', conflict],
    ['multi-write-is-atomic', atomic],
  ] as const)('fails the BAD mutation on %s', async (criterionId, subject) => {
    expect(await status(bad.baseUrl, subject(bad.baseUrl), criterionId)).toBe('fail');
  });

  it.each([
    ['concurrent-conflict-surfaces', conflict],
    ['multi-write-is-atomic', atomic],
  ] as const)('passes the GOOD mutation on %s', async (criterionId, subject) => {
    expect(await status(good.baseUrl, subject(good.baseUrl), criterionId)).toBe('pass');
  });

  it('emits the mutation-atomicity accuracy number', async () => {
    const cases = [
      ['concurrent-conflict-surfaces', conflict],
      ['multi-write-is-atomic', atomic],
    ] as const;
    let detected = 0;
    let falseAlarms = 0;
    for (const [criterionId, subject] of cases) {
      if ((await status(bad.baseUrl, subject(bad.baseUrl), criterionId)) === 'fail') detected++;
      if ((await status(good.baseUrl, subject(good.baseUrl), criterionId)) === 'fail') falseAlarms++;
    }
    console.log(`\n[AVP] mutation-atomicity detection=${detected}/${cases.length}  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(cases.length);
    expect(falseAlarms).toBe(0);
  });
});
