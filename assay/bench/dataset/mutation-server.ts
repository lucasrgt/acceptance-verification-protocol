import http from 'node:http';
import type { AddressInfo } from 'node:net';

interface RunningMutationServer {
  readonly baseUrl: string;
  close(): Promise<void>;
}

/** Repro server for lost-update and partial-write mutation defects. */
export function startMutationServer(variant: 'good' | 'bad'): Promise<RunningMutationServer> {
  let version = 'v1';
  let primary = 'original';
  let secondary = 'original';
  let conflictRequests = 0;
  let faulted = false;
  const server = http.createServer((request, response) => {
    if (request.method === 'PUT' && request.url === '/conflict') {
      conflictRequests++;
      if (variant === 'good' && request.headers['if-match'] !== version) {
        response.statusCode = 412;
        if (conflictRequests % 2 === 0) version = 'v1';
        return response.end('{}');
      }
      version = 'v2';
      response.statusCode = 200;
      if (conflictRequests % 2 === 0) version = 'v1';
      return response.end('{}');
    }
    if (request.method === 'POST' && request.url === '/fault') {
      primary = 'partial';
      if (variant === 'good') primary = 'original';
      faulted = true;
      response.statusCode = 500;
      return response.end('{}');
    }
    if (request.method === 'GET' && request.url === '/state') {
      response.setHeader('content-type', 'application/json');
      const snapshot = JSON.stringify({ primary, secondary });
      if (faulted) {
        primary = 'original';
        secondary = 'original';
        faulted = false;
      }
      return response.end(snapshot);
    }
    response.statusCode = 404;
    response.end('{}');
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise<void>((done) => server.close(() => done())),
      });
    });
  });
}
