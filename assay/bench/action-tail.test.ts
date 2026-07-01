import type { ReactElement } from 'react';
import { verify } from '../src/adapter-react/verify';
import { actionEffect } from '../src/archetypes/action-effect';
import type { ActionEffectSubject } from '../src/adapter-react/subject';
import { pairAccuracy } from './harness';
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

pairAccuracy({
  label: 'action-effect tail',
  pairs: [
    { name: 'onboarding-form', targetCriterion: 'request-accepted', source: 'c1849234', good: onboarding(GoodOnboarding), bad: onboarding(BadOnboarding) },
    { name: 'service-create', targetCriterion: 'idempotent-retry', source: '0188869f', good: wizard(GoodWizard), bad: wizard(BadWizard) },
    { name: 'charge-action', targetCriterion: 'survives-token-refresh', source: 'b4b0fc07', good: charge(GoodCharge), bad: charge(BadCharge) },
  ],
  run: (subject) => verify(actionEffect, subject),
});
