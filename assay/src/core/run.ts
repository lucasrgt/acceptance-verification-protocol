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
  /** Applicability gate: return why the criterion is provably irrelevant to this subject, else null. */
  applies?(criterion: CompiledCriterion): string | null;
  /** Evidence handed to the judge for a `model` criterion. */
  gatherEvidence?(condition: Condition): Promise<unknown> | unknown;
  /** Judge for `model` oracles. Without it, model criteria are unresolved. */
  readonly judge?: Judge;
}

/**
 * Runs an archetype's criteria through the adapter hooks and returns a Verdict.
 * The executor, not a test runner — it runs inside any host (Vitest, Jest,
 * node --test, a script). A criterion whose oracle isn't available, or that
 * is irrelevant is `not-applicable`; a required oracle that cannot run is
 * `unresolved`. Neither state can manufacture a green verdict.
 */
export async function runVerification(
  subjectName: string,
  archetype: Archetype,
  hooks: VerifyHooks,
): Promise<Verdict> {
  const started = performance.now();
  const results: CriterionVerdict[] = [];
  for (const c of archetype.criteria) {
    const t0 = performance.now();
    const r = await runCriterion(c, hooks);
    results.push({ ...r, durationMs: Math.round(performance.now() - t0) });
  }
  return aggregate(subjectName, archetype.name, archetype.version, results, Math.round(performance.now() - started));
}

async function runCriterion(c: CompiledCriterion, hooks: VerifyHooks): Promise<CriterionVerdict> {
  const notApplicableReason = hooks.applies?.(c);
  if (notApplicableReason) {
    return { criterionId: c.id, status: 'not-applicable', reason: notApplicableReason };
  }

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
        // Not an AvpFail: an infrastructure/logic error. Still a FAIL (never abort the
        // verdict), but keep the whole error as evidence so the cause is diagnosable.
        const message = e instanceof Error ? e.message : String(e);
        return {
          criterionId: c.id,
          status: 'fail',
          reason: `Unexpected error while verifying: ${message}`,
          evidence: { error: message, stack: e instanceof Error ? e.stack : undefined },
        };
      }
    }

    case 'model': {
      if (!hooks.judge) {
        return {
          criterionId: c.id,
          status: 'unresolved',
          reason: 'No judge provided — pass { judge } to verify() to evaluate model criteria.',
        };
      }
      const evidence = hooks.gatherEvidence ? await hooks.gatherEvidence(c.condition) : undefined;
      const v = await hooks.judge({
        criterion: { id: c.id, statement: c.statement, rubric: c.oracleSpec.rubric },
        evidence,
      });
      // Keep the judging model on the evidence trail: a model verdict must be auditable.
      const judged = v.model !== undefined ? { evidence, judgedBy: v.model } : evidence;
      return { criterionId: c.id, status: v.pass ? 'pass' : 'fail', reason: v.reason, evidence: judged };
    }

    case 'human':
      return { criterionId: c.id, status: 'unresolved', reason: `Human oracle (queued): ${c.oracleSpec.note}` };
  }
}
