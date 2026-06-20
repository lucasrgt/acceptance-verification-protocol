import http from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * Faithful reproduction of the return-URL binding escape — creating a payment
 * checkout/OAuth preference whose return URLs are absent, null, relative, or a
 * dev/placeholder host. The user pays, then the provider has nowhere real to send
 * them back. The class is confirmed cross-stack in .NET by bitwarden's missing/added
 * RedirectUris fixes (aa1665065, 004e3c58e).
 *
 *   POST /checkout → { id, init_point, back_urls: { success, failure, pending } }
 *
 * Variants:
 *   good            : back_urls bound to the configured app origin, absolute https, all transitions
 *   missing          : no back_urls at all (the headline "missing back_urls" escape)
 *   null-urls        : back_urls present but every value null
 *   localhost        : dev URLs (http://localhost:3000/...) shipped to prod
 *   placeholder-host : a placeholder domain (https://example.com/...)
 *   partial          : success bound, failure missing (only some transitions)
 *   relative         : "/checkout/success" — relative, not an absolute URL a provider can use
 */
export type CheckoutVariant =
  | 'good'
  | 'missing'
  | 'null-urls'
  | 'localhost'
  | 'placeholder-host'
  | 'partial'
  | 'relative';

/** The configured app origin a correctly-bound checkout returns to (neutral, not a placeholder host). */
export const APP_ORIGIN = 'https://app.lumora.co';

export interface RunningServer {
  readonly port: number;
  readonly baseUrl: string;
  close(): Promise<void>;
}

type BackUrls = Partial<Record<'success' | 'failure' | 'pending', string | null>>;

function backUrls(variant: CheckoutVariant): BackUrls | undefined {
  const at = (origin: string, t: string) => `${origin}/checkout/${t}`;
  switch (variant) {
    case 'good':
      return { success: at(APP_ORIGIN, 'success'), failure: at(APP_ORIGIN, 'failure'), pending: at(APP_ORIGIN, 'pending') };
    case 'missing':
      return undefined;
    case 'null-urls':
      return { success: null, failure: null, pending: null };
    case 'localhost':
      return { success: at('http://localhost:3000', 'success'), failure: at('http://localhost:3000', 'failure'), pending: at('http://localhost:3000', 'pending') };
    case 'placeholder-host':
      return { success: at('https://example.com', 'success'), failure: at('https://example.com', 'failure'), pending: at('https://example.com', 'pending') };
    case 'partial':
      return { success: at(APP_ORIGIN, 'success'), pending: at(APP_ORIGIN, 'pending') };
    case 'relative':
      return { success: '/checkout/success', failure: '/checkout/failure', pending: '/checkout/pending' };
  }
}

export function startCheckoutServer(variant: CheckoutVariant): Promise<RunningServer> {
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/checkout') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        const back = backUrls(variant);
        return res.end(
          JSON.stringify({
            id: 'pref_1',
            init_point: `https://provider.test/checkout/pref_1`,
            ...(back !== undefined ? { back_urls: back } : {}),
          }),
        );
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
