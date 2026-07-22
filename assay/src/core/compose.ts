import { PROTOCOL_VERSION, type CriterionVerdict, type Verdict } from './types';

/**
 * A feature-level verdict: several archetype Verdicts for ONE subject composed into a
 * single score — the unit a product owner reads ("is the feature done?"), where a
 * per-archetype Verdict is the unit an agent fixes. Same shape as Verdict so every
 * consumer (formatVerdict, CI gates) works on either.
 */
export interface FeatureVerdict extends Omit<Verdict, 'archetype' | 'archetypeVersion'> {
  /** The archetypes composed, in order. */
  readonly archetypes: readonly string[];
}

/**
 * Composes per-archetype Verdicts into one FeatureVerdict. Criterion ids are prefixed
 * with their archetype (`archetype/criterion-id`) so composed results stay unambiguous.
 * The score is passed/applicable over the union — each criterion weighs the same,
 * exactly as inside a single archetype.
 */
export function composeVerdicts(subject: string, verdicts: readonly Verdict[]): FeatureVerdict {
  if (verdicts.length === 0) throw new Error('composeVerdicts needs at least one Verdict.');
  const results: CriterionVerdict[] = verdicts.flatMap((v) =>
    v.results.map((r) => ({ ...r, criterionId: `${v.archetype}/${r.criterionId}` })),
  );
  const applicable = results.filter((r) => r.status === 'pass' || r.status === 'fail').length;
  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.some((r) => r.status === 'fail');
  const unresolved = results.filter((r) => r.status === 'unresolved').length;
  const notApplicable = results.filter((r) => r.status === 'not-applicable').length;
  return {
    subject,
    archetypes: verdicts.map((v) => v.archetype),
    protocolVersion: PROTOCOL_VERSION,
    results,
    outcome: failed ? 'fail' : applicable === 0 || unresolved > 0 ? 'inconclusive' : 'pass',
    applicable,
    passed,
    unresolved,
    notApplicable,
    acceptanceScore: applicable === 0 ? null : passed / applicable,
    durationMs: verdicts.reduce((total, v) => total + v.durationMs, 0),
  };
}
