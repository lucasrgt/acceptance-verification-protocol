import { it, expect } from 'vitest';
import type { Archetype, Judge } from '../core/dsl';
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
    const verdict = await verify(archetype, subject, { judge: options.judge });
    // eslint-disable-next-line no-console
    console.log('\n' + formatVerdict(verdict));
    const fails = verdict.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(verdict.acceptanceScore).toBeGreaterThanOrEqual(options.threshold ?? 1);
  });
}
