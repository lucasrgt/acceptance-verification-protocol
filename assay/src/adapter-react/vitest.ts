import { it, expect } from 'vitest';
import type { Archetype, Judge } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import { verify } from './verify';
import { formatVerdict } from '../core/format';

export interface VerificationOptions {
  /** Judge for `model` oracles (see verify). */
  readonly judge?: Judge;
  /** Minimum acceptanceScore to pass (default 1 = all applicable criteria green). */
  readonly threshold?: number;
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

/**
 * Declarative verification on a Vitest host — no hand-written describe/it/expect.
 * You author *what* to verify (an archetype + a subject); this registers the run,
 * prints the verdict, and gates on the acceptance threshold. The host (Vitest) is
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
    // The threshold governs the gate: fails below it break the run, and the failure
    // message carries the actionable reasons. threshold 1 (default) = zero fails allowed.
    const threshold = options.threshold ?? 1;
    const fails = verdict.results.filter((r) => r.status === 'fail');
    expect(
      verdict.acceptanceScore,
      `acceptance ${Math.round(verdict.acceptanceScore * 100)}% < required ${Math.round(threshold * 100)}%\n${JSON.stringify(fails, null, 2)}`,
    ).toBeGreaterThanOrEqual(threshold);
  });
}
