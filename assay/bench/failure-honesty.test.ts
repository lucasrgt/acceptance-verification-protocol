import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { failureHonesty } from '../src/archetypes/failure-honesty';
import type { HttpFailureHonestySubject } from '../src/adapter-http/subject';
import { verifyHttp } from '../src/adapter-http/verify';

async function start(phantomSuccess: boolean) {
  const server = http.createServer((_request, response) => {
    response.statusCode = phantomSuccess ? 200 : 502;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(phantomSuccess ? { ok: true } : { error: 'mail delivery failed' }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

let good: Awaited<ReturnType<typeof start>>;
let bad: Awaited<ReturnType<typeof start>>;
beforeAll(async () => {
  good = await start(false);
  bad = await start(true);
});
afterAll(async () => {
  await good.close();
  await bad.close();
});

const subject = (baseUrl: string): HttpFailureHonestySubject => ({
  name: 'send-message-with-mail-down',
  request: { method: 'POST', url: `${baseUrl}/send`, body: { message: 'hello' } },
});

async function status(baseUrl: string) {
  const verdict = await verifyHttp(failureHonesty, subject(baseUrl));
  return verdict.results.find((result) => result.criterionId === 'dependency-failure-is-admitted')?.status;
}

describe('AVP — verifier accuracy (failure-honesty)', () => {
  it('fails the BAD operation that swallows dependency failure as success', async () => {
    expect(await status(bad.baseUrl)).toBe('fail');
  });

  it('passes the GOOD operation that admits dependency failure', async () => {
    expect(await status(good.baseUrl)).toBe('pass');
  });

  it('emits the failure-honesty accuracy number', async () => {
    const detected = (await status(bad.baseUrl)) === 'fail' ? 1 : 0;
    const falseAlarms = (await status(good.baseUrl)) === 'fail' ? 1 : 0;
    console.log(`\n[AVP] failure-honesty detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});
