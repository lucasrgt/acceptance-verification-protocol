import http from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * Faithful reproduction of the server-authority escape — the marketplace recording
 * a client-sent value (the terms version / price) instead of resolving it
 * server-side. The class is confirmed cross-stack in .NET by bitwarden's "restrict
 * users from sending altered values being saved to the database" fix (ae5508d14) and
 * a server-side storage-limit bypass (3b5bb7680).
 *
 *   POST /orders { itemId, priceCents } → { itemId, recordedPriceCents }
 *
 * The catalog price of sku-1 is 10000. A correct server ALWAYS records 10000,
 * whatever priceCents the client sends. The bad variants let the client's value
 * leak into what gets recorded.
 *
 * Variants:
 *   good     : record the catalog price, ignore the client entirely (authoritative)
 *   echo     : record the client's priceCents (full trust)
 *   min      : record min(client, catalog) — the "cheaper price wins" attack
 *   fallback : record client ?? catalog — client always present, so always trusted
 *   clamp    : record client clamped to [0, 2*catalog] — still varies with the client
 *   average  : record round((client + catalog) / 2) — partial trust
 */
export type AuthorityVariant = 'good' | 'echo' | 'min' | 'fallback' | 'clamp' | 'average';

/** The catalog (server) truth. */
export const CATALOG: Record<string, number> = { 'sku-1': 10000 };

export interface RunningServer {
  readonly port: number;
  readonly baseUrl: string;
  close(): Promise<void>;
}

function record(variant: AuthorityVariant, itemId: string, clientPrice: number | undefined): number {
  const truth = CATALOG[itemId] ?? 0;
  switch (variant) {
    case 'good':
      return truth;
    case 'echo':
      return clientPrice ?? truth;
    case 'min':
      return Math.min(clientPrice ?? truth, truth);
    case 'fallback':
      return clientPrice ?? truth;
    case 'clamp':
      return Math.max(0, Math.min(clientPrice ?? truth, 2 * truth));
    case 'average':
      return Math.round(((clientPrice ?? truth) + truth) / 2);
  }
}

export function startAuthorityServer(variant: AuthorityVariant): Promise<RunningServer> {
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/orders') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        let itemId = 'sku-1';
        let priceCents: number | undefined;
        try {
          const parsed = JSON.parse(body || '{}') as { itemId?: string; priceCents?: number };
          if (parsed.itemId) itemId = parsed.itemId;
          if (typeof parsed.priceCents === 'number') priceCents = parsed.priceCents;
        } catch {
          /* ignore */
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify({ itemId, recordedPriceCents: record(variant, itemId, priceCents) }));
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
