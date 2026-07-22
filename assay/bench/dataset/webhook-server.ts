import http from 'node:http';
import { createHmac } from 'node:crypto';
import type { AddressInfo } from 'node:net';

/**
 * Faithful reproduction of the unverified-webhook escape (marketplace 692d85af;
 * the class recurs in documenso/gitea/bitwarden). An inbound payment webhook.
 *
 * BAD : processes the callback regardless of signature — a forged call mutates state.
 * GOOD: verifies the HMAC signature; a forged/absent signature is 401.
 */
export const WEBHOOK_SECRET = 'whsec_test_123';
export const sign = (body: string): string => createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');

interface RunningServer {
  readonly baseUrl: string;
  close(): Promise<void>;
}

export function startWebhookServer(variant: 'good' | 'bad' | 'state-good-200' | 'state-bad-200'): Promise<RunningServer> {
  const appliedEvents: string[] = [];
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/webhooks/payment') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        const sig = req.headers['x-signature'];
        const authentic = typeof sig === 'string' && sig === sign(body);
        if (variant === 'good' && !authentic) {
            res.statusCode = 401;
            return res.end('{}');
        }
        const shouldApply = variant === 'bad' || variant === 'state-bad-200' || authentic;
        if (shouldApply) {
          const parsed = JSON.parse(body) as { id?: string; chargeId?: string };
          appliedEvents.push(parsed.id ?? parsed.chargeId ?? 'unknown');
        }
        // State variants deliberately answer 200 even for invalid events. The state is the oracle.
        res.statusCode = 200;
        return res.end('{"ok":true}');
      });
      return;
    }
    if (req.method === 'GET' && req.url === '/events') {
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify(appliedEvents));
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
