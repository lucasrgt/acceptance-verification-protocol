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
  const applicable = results.filter((r) => r.status !== 'skipped').length;
  const passed = results.filter((r) => r.status === 'pass').length;
  return {
    subject,
    archetypes: verdicts.map((v) => v.archetype),
    protocolVersion: PROTOCOL_VERSION,
    results,
    applicable,
    passed,
    acceptanceScore: applicable === 0 ? 1 : passed / applicable,
    durationMs: verdicts.reduce((total, v) => total + v.durationMs, 0),
  };
}
