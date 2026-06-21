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

export function startWebhookServer(variant: 'good' | 'bad'): Promise<RunningServer> {
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/webhooks/payment') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        if (variant === 'good') {
          const sig = req.headers['x-signature'];
          if (typeof sig !== 'string' || sig !== sign(body)) {
            res.statusCode = 401;
            return res.end('{}');
          }
        }
        // BAD: process (approve the charge) without verifying the signature.
        res.statusCode = 200;
        return res.end('{"ok":true}');
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
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise<void>((r) => server.close(() => r())),
      });
    });
  });
}
