import type { ReactElement } from 'react';
import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { actionEffect } from '../src/archetypes/action-effect';
import type { ActionEffectSubject } from '../src/adapter-react/subject';
import {
  GoodOnboarding,
  BadOnboarding,
  GoodWizard,
  BadWizard,
  GoodCharge,
  BadCharge,
} from './dataset/action-tail';

/**
 * The action-effect tail benchmark — three more real escapes, each gated to the
 * subjects that declare its seam (contract / retryable / refresh) so unrelated
 * subjects skip it honestly.
 */
const API = 'http://localhost/api';
const isDateOnly = (b: unknown) => /^\d{4}-\d{2}-\d{2}$/.test((b as { birthDate?: string })?.birthDate ?? '');

const onboarding = (render: () => ReactElement): ActionEffectSubject => ({
  name: 'onboarding-form',
  render,
  endpoint: { method: 'POST', path: `${API}/onboarding` },
  action: { role: 'button', name: /save/i },
  input: { role: 'textbox', name: /birth date/i },
  draftSample: '1990-05-05',
  accepts: isDateOnly,
});

const wizard = (render: () => ReactElement): ActionEffectSubject => ({
  name: 'service-create',
  render,
  endpoint: { method: 'POST', path: `${API}/services` },
  action: { role: 'button', name: /create/i },
  retryable: true,
  successResponse: { id: 'svc-1' },
});

const charge = (render: () => ReactElement): ActionEffectSubject => ({
  name: 'charge-action',
  render,
  endpoint: { method: 'POST', path: `${API}/charge` },
  action: { role: 'button', name: /charge/i },
  refreshEndpoint: { method: 'POST', path: `${API}/auth/refresh` },
});

const cases = [
  { criterion: 'request-accepted', source: 'c1849234', good: onboarding(GoodOnboarding), bad: onboarding(BadOnboarding) },
  { criterion: 'idempotent-retry', source: '0188869f', good: wizard(GoodWizard), bad: wizard(BadWizard) },
  { criterion: 'survives-token-refresh', source: 'b4b0fc07', good: charge(GoodCharge), bad: charge(BadCharge) },
];

describe('AVP — verifier accuracy (action-effect tail)', () => {
  for (const c of cases) {
    it(`fails the BAD ${c.good.name} on "${c.criterion}" (escape ${c.source})`, async () => {
      const v = await verify(actionEffect, c.bad);
      const target = v.results.find((r) => r.criterionId === c.criterion);
      expect(target, `criterion ${c.criterion} missing`).toBeDefined();
      expect(target?.status, target?.reason).toBe('fail');
    });

    it(`passes the GOOD ${c.good.name} with no false alarm`, async () => {
      const v = await verify(actionEffect, c.good);
      const fails = v.results.filter((r) => r.status === 'fail');
      expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    });
  }

  it('emits the action-effect tail number', async () => {
    let detected = 0;
    let falseAlarms = 0;
    for (const c of cases) {
      const bad = await verify(actionEffect, c.bad);
      const good = await verify(actionEffect, c.good);
      if (bad.results.find((r) => r.criterionId === c.criterion)?.status === 'fail') detected++;
      if (good.results.some((r) => r.status === 'fail')) falseAlarms++;
    }
    // eslint-disable-next-line no-console
    console.log(`\n[AVP] action-effect tail detection=${detected}/${cases.length}  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(cases.length);
    expect(falseAlarms).toBe(0);
  });
});
