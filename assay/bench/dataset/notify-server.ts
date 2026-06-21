import http from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * Faithful reproduction of the missing-2nd-order-effect escape (marketplace
 * 81c919ed: "notify both parties on every booking transition"; the largest backend
 * cluster in the corpus). Accepting a booking should notify BOTH the host and the
 * traveler.
 *
 * BAD : notifies only the host — the traveler never hears about it.
 * GOOD: notifies both parties.
 */
interface RunningServer {
  readonly baseUrl: string;
  close(): Promise<void>;
}

export function startNotifyServer(variant: 'good' | 'bad'): Promise<RunningServer> {
  const inbox: Record<string, { type: string }[]> = { host: [], traveler: [] };

  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && /^\/bookings\/[^/]+\/accept$/.test(req.url ?? '')) {
      inbox.host.push({ type: 'booking-accepted' });
      if (variant === 'good') inbox.traveler.push({ type: 'booking-accepted' }); // BAD forgets the traveler
      res.statusCode = 200;
      return res.end('{"ok":true}');
    }
    const m = /^\/inbox\/([^/]+)$/.exec(req.url ?? '');
    if (req.method === 'GET' && m) {
      res.statusCode = 200;
      return res.end(JSON.stringify(inbox[m[1]] ?? []));
    }
    res.statusCode = 404;
    res.end('{}');
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
