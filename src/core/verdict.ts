import type { CriterionVerdict, Verdict } from './types';

/** Aggregates per-criterion verdicts into a Verdict, with the acceptanceScore (skipped does not count). */
export function aggregate(
  subject: string,
  archetype: string,
  results: CriterionVerdict[],
): Verdict {
  const applicable = results.filter((r) => r.status !== 'skipped');
  const passed = applicable.filter((r) => r.status === 'pass').length;
  const acceptanceScore = applicable.length === 0 ? 1 : passed / applicable.length;
  return { subject, archetype, results, acceptanceScore };
}
