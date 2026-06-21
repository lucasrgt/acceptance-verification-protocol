import http from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * Faithful reproduction of the duplicate-effect escape (`idempotency-key-honored`): a
 * create endpoint must apply a request carrying an idempotency key at most once.
 * Grounded in cal.com "Prevent duplicate bookings with idempotency key" (d85e0b51) and
 * documenso "rework stripe webhooks into idempotent subscription sync" (3887aa67).
 *
 * POST /resources with header `Idempotency-Key: <k>` returns { id }. Correct: the same
 * key replays the original id, a new key mints a new id.
 *
 * Variants:
 *   good          : persists the key, replays the original id; new key → new id
 *   no-idempotency: ignores the key — every POST mints a new id (duplicate)
 *   key-in-body   : looks for the key in the BODY (it's in the header) → never dedups
 *   dedup-all     : returns the same id regardless of the key → distinct ops collide
 *   expires-now   : stores the key then immediately drops it → never replays (duplicate)
 */
export type IdempotencyVariant = 'good' | 'no-idempotency' | 'key-in-body' | 'dedup-all' | 'expires-now';

interface RunningServer {
  readonly baseUrl: string;
  close(): Promise<void>;
}

async function readBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function startIdempotencyServer(variant: IdempotencyVariant): Promise<RunningServer> {
  const seen = new Map<string, number>();
  let counter = 0;

  const server = http.createServer((req, res) => {
    void (async () => {
      if (req.method === 'POST' && req.url === '/resources') {
        const body = await readBody(req);
        const headerKey = (req.headers['idempotency-key'] as string | undefined) ?? '';
        const key = variant === 'key-in-body' ? String(body.idempotencyKey ?? '') : headerKey;

        if (variant === 'dedup-all') {
          if (counter === 0) counter = 1;
          res.statusCode = 200;
          return res.end(JSON.stringify({ id: 1 })); // ignores the key entirely
        }
        if (variant !== 'no-idempotency' && key && seen.has(key)) {
          res.statusCode = 200;
          return res.end(JSON.stringify({ id: seen.get(key) })); // replay
        }
        const id = ++counter;
        if (variant !== 'no-idempotency' && key) {
          seen.set(key, id);
          if (variant === 'expires-now') seen.delete(key); // never durably persisted
        }
        res.statusCode = 201;
        return res.end(JSON.stringify({ id }));
      }
      res.statusCode = 404;
      res.end('{}');
    })();
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise<void>((r) => server.close(() => r())),
      });
    });
  });
}
