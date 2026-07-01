import http from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * Faithful reproduction of the unresolvable-callback escape — a webhook arrives
 * without enough to resolve the domain entity it concerns (no charge id), and the
 * server accepts it anyway (200), silently dropping the event or mutating the wrong
 * entity. The class is confirmed cross-stack in Node/TS by documenso's "include
 * envelopeId in webhook payload" (a99bdf5e) and "viewed webhook had stale data"
 * (8fbace0f).
 *
 *   POST /webhooks/payment { chargeId?, status } → 200 (applied) | 422 (can't resolve)
 *
 * Known charges: { ch_1 }. A correct server refuses a callback with no/unknown
 * chargeId; the bad variants accept it.
 *
 * Variants:
 *   good             : resolve chargeId against the store; refuse (422) when it can't
 *   no-validation     : accept any payload (never resolves)
 *   default-entity    : a missing chargeId falls back to a default charge (mis-applies)
 *   ignored-lookup    : look the charge up but ignore a not-found result, accept anyway
 *   loose-gate        : a buggy truthiness gate lets a missing id through
 */
export type CallbackVariant = 'good' | 'no-validation' | 'default-entity' | 'ignored-lookup' | 'loose-gate';

export interface RunningServer {
  readonly port: number;
  readonly baseUrl: string;
  close(): Promise<void>;
}

export function startCallbackServer(variant: CallbackVariant): Promise<RunningServer> {
  const charges: Record<string, { paid: boolean }> = { ch_1: { paid: false } };

  const decide = (chargeId: string | undefined): boolean => {
    switch (variant) {
      case 'good':
        return !!chargeId && chargeId in charges;
      case 'no-validation':
        return true;
      case 'default-entity':
        return true; // will mutate charges.ch_1 when the id is missing
      case 'ignored-lookup': {
        void (chargeId ? charges[chargeId] : undefined); // looked up, result discarded
        return true;
      }
      case 'loose-gate':
        // eslint-disable-next-line no-constant-condition -- the BAD mutant: the gate is deliberately a tautology
        return chargeId || true ? true : false;
    }
  };

  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/webhooks/payment') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        let chargeId: string | undefined;
        try {
          chargeId = (JSON.parse(body || '{}') as { chargeId?: string }).chargeId;
        } catch {
          /* ignore */
        }
        if (!decide(chargeId)) {
          res.statusCode = 422;
          return res.end(JSON.stringify({ error: 'unresolved_entity' }));
        }
        const target = chargeId && chargeId in charges ? chargeId : 'ch_1';
        charges[target].paid = true;
        res.statusCode = 200;
        return res.end(JSON.stringify({ applied: target }));
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
