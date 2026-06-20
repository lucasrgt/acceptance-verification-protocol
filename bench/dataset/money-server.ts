import http from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * Faithful reproduction of the money-split escape — the marketplace's 15/85
 * platform/host fee split (the class confirmed cross-stack in .NET by bitwarden's
 * currency-invariant money fix). A booking total in cents must split into a
 * platform share and a host share that **sum back to the whole, exact to the cent**.
 *
 * The real bug is computing each share independently with float-percentage math:
 * `round(total*0.15)` + `round(total*0.85)` drifts a cent on many totals
 * (t=10 → 2 + 9 = 11). The GOOD server does integer-basis-point math and assigns
 * the remainder deterministically, so the split is exact for every total.
 *
 *   POST /split { totalCents } → { platformCents, hostCents }
 *
 * Variants:
 *   good          : integer floor(total*bps/10000), remainder to host (exact)
 *   round-both     : Math.round each share independently (the headline leak)
 *   floor-both     : Math.floor each share (loses a cent)
 *   ceil-both      : Math.ceil each share (mints a cent)
 *   float-truncate : (total*0.15 | 0) each — float precision + bitwise truncation
 *   misproportion  : sums to the whole but splits 50/50, not 15/85 (wrong fraction)
 */
export type MoneyVariant =
  | 'good'
  | 'round-both'
  | 'floor-both'
  | 'ceil-both'
  | 'float-truncate'
  | 'misproportion';

/** Platform fee, in basis points (1500 = 15%). The remainder is the host's payout. */
export const PLATFORM_BPS = 1500;

export interface RunningServer {
  readonly port: number;
  readonly baseUrl: string;
  close(): Promise<void>;
}

function split(variant: MoneyVariant, total: number): { platformCents: number; hostCents: number } {
  switch (variant) {
    case 'good': {
      const platformCents = Math.floor((total * PLATFORM_BPS) / 10000);
      return { platformCents, hostCents: total - platformCents };
    }
    case 'round-both':
      return { platformCents: Math.round(total * 0.15), hostCents: Math.round(total * 0.85) };
    case 'floor-both':
      return { platformCents: Math.floor(total * 0.15), hostCents: Math.floor(total * 0.85) };
    case 'ceil-both':
      return { platformCents: Math.ceil(total * 0.15), hostCents: Math.ceil(total * 0.85) };
    case 'float-truncate':
      return { platformCents: (total * 0.15) | 0, hostCents: (total * 0.85) | 0 };
    case 'misproportion': {
      const platformCents = Math.floor(total / 2);
      return { platformCents, hostCents: total - platformCents };
    }
  }
}

export function startMoneyServer(variant: MoneyVariant): Promise<RunningServer> {
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/split') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        let total = 0;
        try {
          total = Number((JSON.parse(body || '{}') as { totalCents?: number }).totalCents ?? 0);
        } catch {
          /* ignore */
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify(split(variant, total)));
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
