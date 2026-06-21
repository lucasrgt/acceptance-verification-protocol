import { AvpFail, type Archetype, type CompiledCriterion, type Judge, type Probe } from './dsl';
import type { Condition, CriterionVerdict, Verdict } from './types';
import { aggregate } from './verdict';

/**
 * Adapter-provided hooks — the ONLY things the core needs from an adapter to run a
 * spec. Observation lives here (probe/evidence/applicability); orchestration lives
 * in `runVerification`. This split is the protocol's execution model: the core is
 * framework-neutral; the adapter binds the hooks to a real substrate (DOM, HTTP, …).
 */
export interface VerifyHooks {
  /** Build the probe for a mechanical criterion under its condition. */
  probe(condition: Condition): Probe;
  /** Applicability gate: return a skip reason when the criterion doesn't apply to this subject, else null. */
  applies?(criterion: CompiledCriterion): string | null;
  /** Evidence handed to the judge for a `model` criterion. */
  gatherEvidence?(condition: Condition): Promise<unknown> | unknown;
  /** Judge for `model` oracles. Without it, model criteria are `skipped`. */
  readonly judge?: Judge;
}

/**
 * Runs an archetype's criteria through the adapter hooks and returns a Verdict.
 * The executor, not a test runner — it runs inside any host (Vitest, Jest,
 * node --test, a script). A criterion whose oracle isn't available, or that
 * doesn't apply, is `skipped` (honest coverage — never inflate the score).
 */
export async function runVerification(
  subjectName: string,
  archetype: Archetype,
  hooks: VerifyHooks,
): Promise<Verdict> {
  const results: CriterionVerdict[] = [];
  for (const c of archetype.criteria) {
    results.push(await runCriterion(c, hooks));
  }
  return aggregate(subjectName, archetype.name, results);
}

async function runCriterion(c: CompiledCriterion, hooks: VerifyHooks): Promise<CriterionVerdict> {
  const skipReason = hooks.applies?.(c);
  if (skipReason) return { criterionId: c.id, status: 'skipped', reason: skipReason };

  switch (c.oracleSpec.kind) {
    case 'mechanical': {
      const probe = hooks.probe(c.condition);
      try {
        await c.oracleSpec.body(probe);
        return { criterionId: c.id, status: 'pass', reason: c.statement };
      } catch (e) {
        if (e instanceof AvpFail) {
          return { criterionId: c.id, status: 'fail', reason: e.message, evidence: e.evidence };
        }
        return {
          criterionId: c.id,
          status: 'fail',
          reason: `Unexpected error while verifying: ${(e as Error).message}`,
        };
      }
    }

    case 'model': {
      if (!hooks.judge) {
        return {
          criterionId: c.id,
          status: 'skipped',
          reason: 'No judge provided — pass { judge } to verify() to evaluate model criteria.',
        };
      }
      const evidence = hooks.gatherEvidence ? await hooks.gatherEvidence(c.condition) : undefined;
      const v = await hooks.judge({
        criterion: { id: c.id, statement: c.statement, rubric: c.oracleSpec.rubric },
        evidence,
      });
      return { criterionId: c.id, status: v.pass ? 'pass' : 'fail', reason: v.reason, evidence };
    }

    case 'human':
      return { criterionId: c.id, status: 'skipped', reason: `Human oracle (queued): ${c.oracleSpec.note}` };
  }
}
