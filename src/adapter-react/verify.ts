import type { Archetype, Judge } from '../core/dsl';
import type { Verdict } from '../core/types';
import { runVerification, type VerifyHooks } from '../core/run';
import type { ActionEffectSubject } from './subject';
import { reactProbe } from './probe';
import { drive } from './drive';
import { identityProbe, isIdentitySubject, type IdentitySubject } from './identity';
import { dataHonestyHooks } from './data-honesty';
import { personaHooks } from './persona-visibility';
import { navHooks } from './navigation-integrity';
import { mountStabilityHooks } from './mount-stability';
import { lifecycleFeHooks } from './lifecycle-gate';
import { temporalHooks } from './temporal-integrity';
import { paginationHooks } from './pagination-integrity';
import { resilienceHooks } from './render-resilience';
import { moneyDisplayHooks } from './money-integrity';

export interface VerifyOptions {
  /** Judge for `model` oracles. Without it, model criteria are `skipped`. */
  readonly judge?: Judge;
}

/** Minimal subject contract the registry dispatches on. */
type NamedSubject = { readonly name: string };

/**
 * The React adapter's hooks for the `action-effect` archetype. Dispatches by subject
 * shape: an action subject drives a control (the seven action criteria); an identity
 * subject drives a sign-out/sign-in switch (cache-cleared-on-identity). Each criterion
 * is gated to the subject that can observe it.
 */
function actionEffectHooks(subject: ActionEffectSubject | IdentitySubject, options: VerifyOptions): VerifyHooks {
  if (isIdentitySubject(subject)) {
    return {
      probe: () => identityProbe(subject),
      applies: (c) => (c.id === 'cache-cleared-on-identity' ? null : 'Identity subject — action criterion not applicable.'),
    };
  }
  const s = subject;
  return {
    probe: (condition) => reactProbe(s, condition),
    applies: (c) => {
      if (c.id === 'cache-cleared-on-identity') return 'Action subject — identity criterion not applicable.';
      if (c.requires === 'input' && !s.input) {
        return 'Subject has no input — criterion not applicable.';
      }
      if (c.requires === 'projection' && !s.projection) {
        return 'Subject declares no projection — criterion not applicable.';
      }
      if (c.requires === 'contract' && !s.accepts) {
        return 'Subject declares no accepts() contract — criterion not applicable.';
      }
      if (c.requires === 'retryable' && !s.retryable) {
        return 'Subject is not marked retryable — criterion not applicable.';
      }
      if (c.requires === 'singleFlight' && !s.singleFlight) {
        return 'Subject is not marked singleFlight — criterion not applicable.';
      }
      if (c.requires === 'refresh' && !s.refreshEndpoint) {
        return 'Subject declares no refreshEndpoint — criterion not applicable.';
      }
      if (c.requires === 'reconcile' && !s.reconcile) {
        return 'Subject declares no reconcile seam — criterion not applicable.';
      }
      return null;
    },
    gatherEvidence: async (condition) => {
      const driven = await drive(s, condition);
      const text = (document.body.textContent ?? '').replace(/\s+/g, ' ').trim();
      return { text, draft: driven.inputValue(), requests: driven.requests };
    },
    judge: options.judge,
  };
}

/**
 * Per-archetype hooks builders. Adding an archetype to the React adapter = adding
 * one entry here; the neutral `runVerification` does the rest. This registry is
 * the seam that proves the core isn't action-effect-shaped.
 */
const REGISTRY: Record<string, (subject: never, options: VerifyOptions) => VerifyHooks> = {
  'action-effect': actionEffectHooks as (subject: never, options: VerifyOptions) => VerifyHooks,
  'data-honesty': dataHonestyHooks as (subject: never, options: VerifyOptions) => VerifyHooks,
  'persona-scoped-visibility': personaHooks as (subject: never, options: VerifyOptions) => VerifyHooks,
  'navigation-integrity': navHooks as (subject: never, options: VerifyOptions) => VerifyHooks,
  'mount-stability': mountStabilityHooks as (subject: never, options: VerifyOptions) => VerifyHooks,
  'lifecycle-gate': lifecycleFeHooks as (subject: never, options: VerifyOptions) => VerifyHooks,
  'temporal-integrity': temporalHooks as (subject: never, options: VerifyOptions) => VerifyHooks,
  'pagination-integrity': paginationHooks as (subject: never, options: VerifyOptions) => VerifyHooks,
  'render-resilience': resilienceHooks as (subject: never, options: VerifyOptions) => VerifyHooks,
  'money-integrity': moneyDisplayHooks as (subject: never, options: VerifyOptions) => VerifyHooks,
};

/**
 * Runs an archetype against a subject with the React adapter and returns a Verdict.
 * Dispatches by archetype name to the right hooks; the orchestration is neutral
 * (in core). Throws if the adapter has no hooks for the archetype.
 */
export async function verify(
  archetype: Archetype,
  subject: NamedSubject,
  options: VerifyOptions = {},
): Promise<Verdict> {
  const build = REGISTRY[archetype.name];
  if (!build) {
    throw new Error(
      `The React adapter has no hooks for archetype "${archetype.name}" — register it in adapter-react/verify.ts.`,
    );
  }
  return runVerification(subject.name, archetype, build(subject as never, options));
}
