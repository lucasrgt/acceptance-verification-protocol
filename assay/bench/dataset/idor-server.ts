import http from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * Faithful reproduction of the IDOR escape (marketplace 1db3c2fd; confirmed in
 * .NET by bitwarden's cross-organization IDOR). Two hosts owned by two users.
 *
 * BAD : PUT /hosts/:id resolves by id alone — any caller mutates any host.
 * GOOD: PUT /hosts/:id is scoped to the caller (X-User); a foreign id is 404.
 */
export interface RunningServer {
  readonly port: number;
  readonly baseUrl: string;
  close(): Promise<void>;
}

export function startIdorServer(variant: 'good' | 'bad'): Promise<RunningServer> {
  const hosts: Record<string, { owner: string; cpf: string }> = {
    'host-A': { owner: 'A', cpf: '111' },
    'host-B': { owner: 'B', cpf: '222' },
  };

  const server = http.createServer((req, res) => {
    // Privileged operation: list every host (operator-only). BAD lets any
    // authenticated caller through; GOOD enforces the operator role.
    if (req.method === 'GET' && req.url === '/admin/hosts') {
      if (variant === 'good' && req.headers['x-role'] !== 'operator') {
        res.statusCode = 403;
        return res.end('{}');
      }
      res.statusCode = 200;
      return res.end(JSON.stringify(Object.keys(hosts)));
    }
    const m = /^\/hosts\/([^/]+)$/.exec(req.url ?? '');
    if (req.method === 'PUT' && m) {
      const id = m[1];
      const caller = req.headers['x-user'];
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        const host = hosts[id];
        if (!host) {
          res.statusCode = 404;
          return res.end('{}');
        }
        // GOOD scopes the write to the caller; a foreign id never resolves.
        if (variant === 'good' && host.owner !== caller) {
          res.statusCode = 404;
          return res.end('{}');
        }
        // BAD: resolve by id alone — cross-account write.
        try {
          host.cpf = (JSON.parse(body || '{}') as { cpf?: string }).cpf ?? host.cpf;
        } catch {
          /* ignore */
        }
        res.statusCode = 200;
        return res.end(JSON.stringify(host));
      });
      return;
    }
    res.statusCode = 404;
    res.end('{}');
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        port,
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise<void>((r) => server.close(() => r())),
      });
    });
  });
}
