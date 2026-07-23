import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { verifyHttp } from '../../src/adapter-http/verify';
import type { HttpAuthSubject } from '../../src/adapter-http/subject';
import { authorization } from '../../src/archetypes/authorization';

/**
 * Frozen held-out transfer case. The authorization oracle and HTTP adapter were
 * already published as 0.4.0 before this Gitea escape was admitted to the
 * evaluation corpus. Commit 171df0c9ffcec1b0839431e75f3b59e35d39ddca added
 * the missing code-unit permission to private-repository issue-template/config
 * routes.
 */
async function start(variant: 'good' | 'bad') {
  const server = http.createServer((request, response) => {
    if (request.url === '/repos/private/project/issue_config') {
      const canReadCode = request.headers['x-code-reader'] === 'true';
      response.statusCode = variant === 'good' && !canReadCode ? 403 : 200;
      response.end(response.statusCode === 200 ? '{"blank_issues_enabled":true}' : '{"error":"forbidden"}');
      return;
    }
    response.statusCode = 404;
    response.end('{}');
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
  good = await start('good');
  bad = await start('bad');
});
afterAll(async () => {
  await good.close();
  await bad.close();
});

const subject = (baseUrl: string): HttpAuthSubject => ({
  name: 'private-repository-issue-config',
  privileged: {
    method: 'GET',
    url: `${baseUrl}/repos/private/project/issue_config`,
    headers: { authorization: 'token read-repository', 'x-code-reader': 'false' },
  },
});

async function roleStatus(baseUrl: string) {
  const verdict = await verifyHttp(authorization, subject(baseUrl));
  return verdict.results.find((result) => result.criterionId === 'role-required')?.status;
}

describe('AVP held-out — Gitea private repository permission', () => {
  it('detects the pre-fix route that serves issue config without code-unit permission', async () => {
    expect(await roleStatus(bad.baseUrl)).toBe('fail');
  });

  it('passes the fixed route that returns a deliberate 403', async () => {
    expect(await roleStatus(good.baseUrl)).toBe('pass');
  });

  it('proves the fixed route still serves a caller with code-unit permission', async () => {
    const response = await fetch(`${good.baseUrl}/repos/private/project/issue_config`, {
      headers: { authorization: 'token read-repository', 'x-code-reader': 'true' },
    });
    expect(response.status).toBe(200);
  });

  it('emits the frozen held-out accuracy number', async () => {
    const detected = (await roleStatus(bad.baseUrl)) === 'fail' ? 1 : 0;
    const falseAlarms = (await roleStatus(good.baseUrl)) === 'fail' ? 1 : 0;
    console.log(`\n[AVP] held-out gitea role-required detection=${detected}/1  false-alarm=${falseAlarms}/1\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});
