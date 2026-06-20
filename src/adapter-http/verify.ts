import type { Archetype } from '../core/dsl';
import type { Verdict } from '../core/types';
import { runVerification, type VerifyHooks } from '../core/run';
import { authHooks } from './probe';
import { webhookHooks } from './integration';
import { notifyHooks } from './second-order';

type NamedSubject = { readonly name: string };

/**
 * Per-archetype HTTP hooks. Adding a backend archetype = one entry here; the
 * neutral `runVerification` (shared with the React adapter) does the rest. The
 * registry is the seam that proves the core isn't DOM-shaped either.
 */
const REGISTRY: Record<string, (subject: never) => VerifyHooks> = {
  'authorization': authHooks as (subject: never) => VerifyHooks,
  'integration-integrity': webhookHooks as (subject: never) => VerifyHooks,
  'second-order-effects': notifyHooks as (subject: never) => VerifyHooks,
};

/**
 * Runs a backend archetype against a subject over HTTP and returns a Verdict. It
 * reuses the SAME neutral core runner as the React adapter (src/core/run.ts) — the
 * proof that the core is substrate-neutral: DOM and HTTP are just two adapters.
 */
export async function verifyHttp(archetype: Archetype, subject: NamedSubject): Promise<Verdict> {
  const build = REGISTRY[archetype.name];
  if (!build) {
    throw new Error(`The HTTP adapter has no hooks for archetype "${archetype.name}".`);
  }
  return runVerification(subject.name, archetype, build(subject as never));
}
