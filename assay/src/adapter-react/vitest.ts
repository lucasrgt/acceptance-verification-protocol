import { it } from 'vitest';
import type { Archetype, Judge } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import { verify } from './verify';
import { formatVerdict } from '../core/format';
import type { Verdict } from '../core/types';

export interface VerificationOptions {
  /** Judge for `model` oracles (see verify). */
  readonly judge?: Judge;
  /** Runs before the verification (e.g. baseline MSW handlers the subject needs on mount). */
  readonly setup?: () => void | Promise<void>;
  readonly label?: string;
  /**
   * Escape hatch for an OFF-CATALOG archetype — hooks binding a domain criterion you
   * authored to the substrate (see ADR 0002). Lets your own criteria run on the same
   * Vitest host (gating + verdict) as the catalog, without registering anything globally.
   */
  readonly hooks?: (subject: { readonly name: string }, options: { readonly judge?: Judge }) => VerifyHooks;
}

/** Fail-closed host policy shared by the Vitest adapter and its contract tests. */
export function requireAccepted(verdict: Verdict): void {
  const fails = verdict.results.filter((result) => result.status === 'fail');
  const unresolved = verdict.results.filter((result) => result.status === 'unresolved');
  if (verdict.outcome === 'inconclusive' || verdict.acceptanceScore === null) {
    throw new Error(
      `verification was inconclusive; no green verdict was produced\n${JSON.stringify(unresolved, null, 2)}`,
    );
  }
  if (verdict.outcome === 'fail') {
    throw new Error(
      `verification failed; every decided criterion is mandatory\n${JSON.stringify(fails, null, 2)}`,
    );
  }
}

/**
 * Declarative verification on a Vitest host — no hand-written describe/it/expect.
 * You author *what* to verify (an archetype + a subject); this registers the run,
 * prints the verdict, and requires a conclusive all-pass outcome. The host (Vitest) is
 * the substrate; the substance — the spec and the verdict — is host-agnostic.
 */
export function defineVerification(
  archetype: Archetype,
  subject: { readonly name: string },
  options: VerificationOptions = {},
): void {
  const label = options.label ?? `${archetype.name} · ${subject.name}`;
  it(`assay: ${label}`, async () => {
    if (options.setup) await options.setup();
    const verdict = await verify(archetype, subject, { judge: options.judge, hooks: options.hooks });
    // eslint-disable-next-line no-console
    console.log('\n' + formatVerdict(verdict));
    requireAccepted(verdict);
  });
}
