import type { Archetype, Judge } from '../core/dsl';
import type { Verdict } from '../core/types';
import { runVerification, type VerifyHooks } from '../core/run';
import type { ActionEffectSubject } from './subject';
import { reactProbe } from './probe';
import { drive } from './drive';
import { dataHonestyHooks } from './data-honesty';
import { personaHooks } from './persona-visibility';
import { navHooks } from './navigation-integrity';
import { mountStabilityHooks } from './mount-stability';

export interface VerifyOptions {
  /** Judge for `model` oracles. Without it, model criteria are `skipped`. */
  readonly judge?: Judge;
}

/** Minimal subject contract the registry dispatches on. */
type NamedSubject = { readonly name: string };

/** The React adapter's hooks for the `action-effect` archetype. */
function actionEffectHooks(subject: ActionEffectSubject, options: VerifyOptions): VerifyHooks {
  return {
    probe: (condition) => reactProbe(subject, condition),
    applies: (c) => {
      if (c.requires === 'input' && !subject.input) {
        return 'Subject has no input — criterion not applicable.';
      }
      if (c.requires === 'projection' && !subject.projection) {
        return 'Subject declares no projection — criterion not applicable.';
      }
      if (c.requires === 'contract' && !subject.accepts) {
        return 'Subject declares no accepts() contract — criterion not applicable.';
      }
      if (c.requires === 'retryable' && !subject.retryable) {
        return 'Subject is not marked retryable — criterion not applicable.';
      }
      if (c.requires === 'refresh' && !subject.refreshEndpoint) {
        return 'Subject declares no refreshEndpoint — criterion not applicable.';
      }
      return null;
    },
    gatherEvidence: async (condition) => {
      const driven = await drive(subject, condition);
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
