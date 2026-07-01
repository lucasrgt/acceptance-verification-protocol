import type { Archetype } from '../core/dsl';
import type { Verdict } from '../core/types';
import { runVerification, type VerifyHooks } from '../core/run';
import { authHooks } from './probe';
import { webhookHooks } from './integration';
import { notifyHooks } from './second-order';
import { moneyHooks } from './money';
import { lifecycleHooks } from './lifecycle';
import { idempotencyHooks } from './idempotency';

type NamedSubject = { readonly name: string };

export interface VerifyHttpOptions {
  /**
   * Escape hatch for an OFF-CATALOG backend archetype — a domain criterion you authored
   * that the catalog registry doesn't know (see ADR 0002). Provide the hooks that bind it
   * to the HTTP substrate; it runs through the same neutral executor. Per-call, never a
   * global registration — custom criteria stay in your repo, off the accuracy benchmark.
   */
  readonly hooks?: (subject: NamedSubject) => VerifyHooks;
}

/**
 * Per-archetype HTTP hooks. Adding a backend archetype = one entry here; the
 * neutral `runVerification` (shared with the React adapter) does the rest. The
 * registry is the seam that proves the core isn't DOM-shaped either.
 *
 * One `any` at the registry seam instead of a cast per entry — see the same note in
 * adapter-react/verify.ts: the subject↔archetype pairing is runtime-keyed, and each
 * builder's own signature stays fully typed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySubjectHooks = (subject: any) => VerifyHooks;
const REGISTRY: Record<string, AnySubjectHooks> = {
  'authorization': authHooks,
  'integration-integrity': webhookHooks,
  'second-order-effects': notifyHooks,
  'money-integrity': moneyHooks,
  'lifecycle-gate': lifecycleHooks,
  'request-idempotency': idempotencyHooks,
};

/**
 * Runs a backend archetype against a subject over HTTP and returns a Verdict. It
 * reuses the SAME neutral core runner as the React adapter (src/core/run.ts) — the
 * proof that the core is substrate-neutral: DOM and HTTP are just two adapters.
 */
export async function verifyHttp(
  archetype: Archetype,
  subject: NamedSubject,
  options: VerifyHttpOptions = {},
): Promise<Verdict> {
  const build = REGISTRY[archetype.name] ?? options.hooks;
  if (!build) {
    throw new Error(
      `The HTTP adapter has no hooks for archetype "${archetype.name}" — pass { hooks } to verifyHttp() for an off-catalog criterion (ADR 0002).`,
    );
  }
  return runVerification(subject.name, archetype, build(subject));
}
