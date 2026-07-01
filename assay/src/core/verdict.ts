import { PROTOCOL_VERSION, type CriterionVerdict, type Verdict } from './types';

/**
 * Aggregates per-criterion verdicts into a Verdict, with the acceptanceScore (skipped
 * does not count) and the version stamps that say which ruler produced it. A run with
 * zero applicable criteria scores 1 by convention — `applicable: 0` is the honest flag
 * that nothing was actually decided.
 */
export function aggregate(
  subject: string,
  archetype: string,
  archetypeVersion: string,
  results: CriterionVerdict[],
  durationMs: number,
): Verdict {
  const applicable = results.filter((r) => r.status !== 'skipped').length;
  const passed = results.filter((r) => r.status === 'pass').length;
  const acceptanceScore = applicable === 0 ? 1 : passed / applicable;
  return {
    subject,
    archetype,
    archetypeVersion,
    protocolVersion: PROTOCOL_VERSION,
    results,
    applicable,
    passed,
    acceptanceScore,
    durationMs,
  };
}
