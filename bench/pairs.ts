import type { ReactElement } from 'react';
import type { ActionEffectSubject } from '../src/adapter-react/subject';
import { GoodComposer, BadComposer } from './dataset/message-composer';
import { GoodRefund, BadRefund } from './dataset/wired-action';
import { GoodDashboard, BadDashboard } from './dataset/dashboard';

/**
 * Labeled dataset: each pair is a REAL escape mined from a real-world tourism project's git
 * history (pre-fix = bad, post-fix = good). This is the SWE-bench of acceptance:
 * the verifier MUST fail the `bad` on `targetCriterion` and pass the `good`.
 */
export interface LabeledPair {
  readonly name: string;
  /** The criterion that must catch the bad variant. */
  readonly targetCriterion: string;
  /** The source-project commit the pattern was mined from. */
  readonly source: string;
  readonly good: ActionEffectSubject;
  readonly bad: ActionEffectSubject;
}

const API = 'http://localhost/api';

const composer = (render: () => ReactElement): ActionEffectSubject => ({
  name: 'message-composer',
  render,
  endpoint: { method: 'POST', path: `${API}/messages` },
  action: { role: 'button', name: /send/i },
  input: { role: 'textbox', name: /message/i },
  draftSample: 'hi, any spots open today?',
});

const refund = (render: () => ReactElement): ActionEffectSubject => ({
  name: 'refund-action',
  render,
  endpoint: { method: 'POST', path: `${API}/refund` },
  action: { role: 'button', name: /refund/i },
});

const dashboard = (render: () => ReactElement): ActionEffectSubject => ({
  name: 'dashboard-remove',
  render,
  endpoint: { method: 'DELETE', path: `${API}/items/:id` },
  action: { role: 'button', name: /remove first/i },
  projection: { role: 'status', name: /remaining/i },
});

export const pairs: readonly LabeledPair[] = [
  {
    name: 'message-composer',
    targetCriterion: 'no-phantom-success',
    source: '04677bf9',
    good: composer(GoodComposer),
    bad: composer(BadComposer),
  },
  {
    name: 'refund-action',
    targetCriterion: 'fires-primary-effect',
    source: '615ed1a7',
    good: refund(GoodRefund),
    bad: refund(BadRefund),
  },
  {
    name: 'dashboard',
    targetCriterion: 'projections-converge',
    source: 'b9659b46',
    good: dashboard(GoodDashboard),
    bad: dashboard(BadDashboard),
  },
];
