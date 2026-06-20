/**
 * AVP core — framework-neutral vocabulary.
 *
 * A `Subject` (feature/flow) is verified against a `Specification` (a set of
 * `Criterion`). Each criterion forces a `Condition` and is decided by an
 * `Oracle`. The output is a per-criterion `Verdict` + an aggregate
 * `acceptanceScore`. This module imports no React/runner: it's the contract
 * that travels across ecosystems.
 */

/** What decides pass/fail. `mechanical` is deterministic; `model` is an LLM-as-judge (probabilistic); `human` is manual. */
export type OracleKind = 'mechanical' | 'model' | 'human';

/** `invariant` holds over all states; `example` is a specific case. */
export type Scope = 'invariant' | 'example';

/**
 * An abstract precondition forced before observing. Three axes, all growing with
 * the archetypes:
 *  - fault injection: `success` | `api-error` | `slow` | `offline`
 *  - data partition:  `empty` (zero rows) | `partial` (rows missing optional fields)
 *  - interaction/recovery: `retry` (the same action activated twice) | `token-expired`
 *    (the first call 401s; recovery must refresh and retry)
 */
export type ConditionId =
  | 'success'
  | 'api-error'
  | 'slow'
  | 'offline'
  | 'empty'
  | 'partial'
  | 'retry'
  | 'double-activate'
  | 'token-expired';

export interface Condition {
  readonly id: ConditionId;
  readonly params?: Readonly<Record<string, unknown>>;
}

export interface Criterion {
  readonly id: string;
  readonly statement: string;
  readonly oracle: OracleKind;
  readonly scope: Scope;
  readonly condition: Condition;
  /** Empirical evidence: commits where the absence of this criterion caused an escape. */
  readonly seenIn?: readonly string[];
}

export interface Specification {
  readonly archetype: string;
  readonly version: string;
  readonly criteria: readonly Criterion[];
}

export type VerdictStatus = 'pass' | 'fail' | 'skipped';

export interface CriterionVerdict {
  readonly criterionId: string;
  /** Actionable: written for the AGENT to fix — says what and why, not just "failed". */
  readonly reason: string;
  readonly status: VerdictStatus;
  readonly evidence?: unknown;
}

export interface Verdict {
  readonly subject: string;
  readonly archetype: string;
  readonly results: readonly CriterionVerdict[];
  /** passed / applicable, in [0,1]. `skipped` does not count. */
  readonly acceptanceScore: number;
}
