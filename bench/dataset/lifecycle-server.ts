import http from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * Faithful reproduction of the client-only-gate escape — a state transition
 * (publish / go-live / sign) that the FE disables but the SERVER does not enforce,
 * so a direct request transitions a resource whose precondition is unmet. The class
 * is confirmed cross-stack in Node/TS by documenso's "prevent signing draft
 * documents" (6e09a470) and in .NET by bitwarden's "prevent non-confirmed SSO users".
 *
 *   POST /listings/:id/publish { ready? } → 200 (published) | 422 (precondition unmet)
 *
 * The real precondition is complete && verified.
 *   draft-1 : complete=true, verified=false  → must be REFUSED
 *   ready-1 : complete=true, verified=true   → must be ALLOWED
 *
 * Variants:
 *   good                : enforce complete && verified, server-side
 *   no-check             : publish anything (no precondition at all)
 *   trust-client-flag    : trust a client-sent `ready` flag in the body
 *   check-complete-only  : check `complete` but forget `verified`
 *   or-not-and           : accept on complete OR verified (wrong boolean)
 */
export type LifecycleVariant = 'good' | 'no-check' | 'trust-client-flag' | 'check-complete-only' | 'or-not-and';

interface Resource {
  complete: boolean;
  verified: boolean;
  published: boolean;
}

export interface RunningServer {
  readonly port: number;
  readonly baseUrl: string;
  close(): Promise<void>;
}

function allowed(variant: LifecycleVariant, r: Resource, clientReady: boolean): boolean {
  switch (variant) {
    case 'good':
      return r.complete && r.verified;
    case 'no-check':
      return true;
    case 'trust-client-flag':
      return clientReady;
    case 'check-complete-only':
      return r.complete;
    case 'or-not-and':
      return r.complete || r.verified;
  }
}

export function startLifecycleServer(variant: LifecycleVariant): Promise<RunningServer> {
  const resources: Record<string, Resource> = {
    'draft-1': { complete: true, verified: false, published: false },
    'ready-1': { complete: true, verified: true, published: false },
  };

  const server = http.createServer((req, res) => {
    const m = /^\/listings\/([^/]+)\/publish$/.exec(req.url ?? '');
    if (req.method === 'POST' && m) {
      const id = m[1];
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        const r = resources[id];
        if (!r) {
          res.statusCode = 404;
          return res.end('{}');
        }
        let clientReady = false;
        try {
          clientReady = (JSON.parse(body || '{}') as { ready?: boolean }).ready === true;
        } catch {
          /* ignore */
        }
        if (!allowed(variant, r, clientReady)) {
          res.statusCode = 422;
          return res.end(JSON.stringify({ error: 'precondition_unmet' }));
        }
        r.published = true;
        res.statusCode = 200;
        return res.end(JSON.stringify({ id, published: true }));
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
