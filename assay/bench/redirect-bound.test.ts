import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { verifyHttp } from '../src/adapter-http/verify';
import { integrationIntegrity } from '../src/archetypes/integration-integrity';
import type { HttpIntegrationSubject } from '../src/adapter-http/subject';
import { startCheckoutServer, APP_ORIGIN, type CheckoutVariant } from './dataset/checkout-server';

/**
 * integration-integrity · redirect-urls-bound — backend, over HTTP. A checkout/OAuth
 * flow must bind its return URLs to the real environment: present for the required
 * transitions, absolute http(s), never a placeholder/dev host or relative path. The
 * headline escape is missing back_urls; confirmed cross-stack in .NET by bitwarden's
 * missing-RedirectUris fixes. This criterion shares the integration-integrity
 * archetype with webhook-signature-verified, gated by seam (the subject here
 * declares only a checkout, so the webhook criterion is not applicable, not failed).
 */
const servers: Partial<Record<CheckoutVariant, Awaited<ReturnType<typeof startCheckoutServer>>>> = {};
const VARIANTS: readonly CheckoutVariant[] = [
  'good',
  'missing',
  'null-urls',
  'localhost',
  'placeholder-host',
  'partial',
  'relative',
];

beforeAll(async () => {
  for (const v of VARIANTS) servers[v] = await startCheckoutServer(v);
});
afterAll(async () => {
  await Promise.all(VARIANTS.map((v) => servers[v]?.close()));
});

const checkoutSubject = (baseUrl: string): HttpIntegrationSubject => ({
  name: 'create-checkout',
  checkout: { method: 'POST', url: `${baseUrl}/checkout`, body: { plan: 'pro' } },
  readReturnUrls: (body) => (body as { back_urls?: Record<string, string | null> }).back_urls ?? {},
  requiredTransitions: ['success', 'failure'],
  expectedOrigin: APP_ORIGIN,
});

const redirectStatus = async (variant: CheckoutVariant) => {
  const v = await verifyHttp(integrationIntegrity, checkoutSubject(servers[variant]!.baseUrl));
  return v.results.find((r) => r.criterionId === 'redirect-urls-bound');
};

describe('AVP — verifier accuracy (integration-integrity · redirect-urls-bound, HTTP adapter)', () => {
  it('fails the BAD backend on "redirect-urls-bound" (missing back_urls — escape bitwarden:aa1665065)', async () => {
    const target = await redirectStatus('missing');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD backend with no false alarm (webhook criterion is not applicable by seam)', async () => {
    const v = await verifyHttp(integrationIntegrity, checkoutSubject(servers.good!.baseUrl));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
    // the unrelated seam is explicitly not applicable, never silently passed
    expect(v.results.find((r) => r.criterionId === 'webhook-signature-verified')?.status).toBe('not-applicable');
  });

  it('emits the redirect-urls-bound (HTTP) number', async () => {
    const detected = (await redirectStatus('missing'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await redirectStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP] integration-integrity · redirect-urls-bound (HTTP adapter) detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for redirect-urls-bound — distinct ways an unbound return URL
 * ships (absent, null, dev host, placeholder domain, partial coverage, relative).
 * A robust criterion kills every one while leaving the bound GOOD checkout green.
 */
const MUTANTS: readonly CheckoutVariant[] = ['missing', 'null-urls', 'localhost', 'placeholder-host', 'partial', 'relative'];

describe('AVP — mutation testing (integration-integrity · redirect-urls-bound)', () => {
  it('kills every unbound-URL mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await redirectStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await redirectStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP mutation] integration-integrity · redirect-urls-bound: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the bound checkout').toBe(false);
  });
});
