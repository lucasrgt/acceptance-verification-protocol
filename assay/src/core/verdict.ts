import { PROTOCOL_VERSION, type CriterionVerdict, type Verdict } from './types';

/**
 * Aggregates per-criterion results into a fail-closed Verdict. A missing denominator
 * produces an inconclusive verdict and a null score; an unavailable required oracle
 * is also inconclusive rather than being erased from the denominator.
 */
export function aggregate(
  subject: string,
  archetype: string,
  archetypeVersion: string,
  results: CriterionVerdict[],
  durationMs: number,
): Verdict {
  const applicable = results.filter((r) => r.status === 'pass' || r.status === 'fail').length;
  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.some((r) => r.status === 'fail');
  const unresolved = results.filter((r) => r.status === 'unresolved').length;
  const notApplicable = results.filter((r) => r.status === 'not-applicable').length;
  const outcome = failed ? 'fail' : applicable === 0 || unresolved > 0 ? 'inconclusive' : 'pass';
  const acceptanceScore = applicable === 0 ? null : passed / applicable;
  return {
    subject,
    archetype,
    archetypeVersion,
    protocolVersion: PROTOCOL_VERSION,
    results,
    outcome,
    applicable,
    passed,
    unresolved,
    notApplicable,
    acceptanceScore,
    durationMs,
  };
}
