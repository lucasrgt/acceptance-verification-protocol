import type { ConditionId, Criterion, Scope, Specification, Substrate } from './types';

/**
 * Declarative authoring surface — reads like a Vitest/Jest file (`archetype`
 * ≈ `describe`, `criterion` ≈ `it`) but in AVP's own vocabulary. It's sugar over
 * the serializable data model: authoring emits a `Specification` (the portable
 * metadata that travels) plus the compiled criteria (with their oracles) that
 * the adapter executes. The mechanical body uses a `Probe`, which the adapter
 * provides — so an archetype stays framework-neutral.
 */

/** Thrown by a probe matcher when a criterion is not satisfied. Carries an actionable reason. */
export class AvpFail extends Error {
  constructor(message: string, readonly evidence?: unknown) {
    super(message);
    this.name = 'AvpFail';
  }
}

/**
 * The observation surface a mechanical check uses. Adapter-provided. `E` is the
 * archetype's own assertion vocabulary (`expect`) — each archetype defines its own
 * and the adapter implements it, so the core stays neutral: it knows there is an
 * `expect`, never what it asserts.
 */
export interface Probe<E = unknown> {
  /** Drive the subject under the criterion's condition (arrange + act). */
  act(): Promise<void>;
  /** Archetype-specific assertions — each throws `AvpFail` with an actionable reason on failure. */
  readonly expect: E;
}

export type MechanicalBody<E = unknown> = (probe: Probe<E>) => Promise<void> | void;

/** The three oracle kinds, as constructors used inside `criterion(...)`. */
export type Oracle =
  | { readonly kind: 'mechanical'; readonly body: MechanicalBody }
  | { readonly kind: 'model'; readonly rubric: string }
  | { readonly kind: 'human'; readonly note: string };

export const mechanical = <E = unknown>(body: MechanicalBody<E>): Oracle => ({
  kind: 'mechanical',
  body: body as MechanicalBody,
});
export const model = (rubric: string): Oracle => ({ kind: 'model', rubric });
export const human = (note: string): Oracle => ({ kind: 'human', note });

/**
 * A judge for `model` oracles: reads a rubric + evidence, returns a verdict.
 * Language-neutral and injectable — the real judge calls an LLM (configured via
 * env/options, never a config file); tests pass a deterministic stub. Without a
 * judge, model criteria are `skipped`.
 */
export interface JudgeRequest {
  readonly criterion: { readonly id: string; readonly statement: string; readonly rubric: string };
  readonly evidence: unknown;
}
export interface JudgeVerdict {
  readonly pass: boolean;
  readonly reason: string;
}
export type Judge = (request: JudgeRequest) => Promise<JudgeVerdict> | JudgeVerdict;

export interface CriterionOptions {
  /** Condition forced before observing (default: `success`). */
  readonly under?: ConditionId;
  /** Default: `invariant`. */
  readonly scope?: Scope;
  /** Applicability gate (a seam key) → the adapter skips the criterion when the subject lacks this seam. */
  readonly requires?: string;
  /** The engine that can decide this criterion (the layered-determinism axis). */
  readonly substrate?: Substrate;
  /** Evidence: commits where the absence of this criterion caused an escape. */
  readonly seenIn?: readonly string[];
}

/** A criterion plus its oracle (the executable form). */
export interface CompiledCriterion extends Criterion {
  readonly requires?: string;
  readonly oracleSpec: Oracle;
}

/** An archetype = a serializable spec (metadata) + the compiled criteria (with oracles). */
export interface Archetype {
  readonly name: string;
  readonly version: string;
  readonly spec: Specification;
  readonly criteria: readonly CompiledCriterion[];
}

let collecting: CompiledCriterion[] | null = null;

/** Declarative authoring entry (≈ `describe`). Emits a serializable spec. */
export function archetype(name: string, version: string, define: () => void): Archetype {
  const previous = collecting;
  const collected: CompiledCriterion[] = [];
  collecting = collected;
  try {
    define();
  } finally {
    collecting = previous;
  }
  const spec: Specification = {
    archetype: name,
    version,
    criteria: collected.map((c) => ({
      id: c.id,
      statement: c.statement,
      oracle: c.oracle,
      scope: c.scope,
      condition: c.condition,
      ...(c.substrate ? { substrate: c.substrate } : {}),
      ...(c.seenIn ? { seenIn: c.seenIn } : {}),
    })),
  };
  return { name, version, spec, criteria: collected };
}

/** Declares one criterion (≈ `it`). Stable `id` first (the protocol identifier), then statement, options, oracle. */
export function criterion(id: string, statement: string, options: CriterionOptions, oracle: Oracle): void {
  if (!collecting) throw new Error('criterion() must be called inside archetype()');
  collecting.push({
    id,
    statement,
    oracle: oracle.kind,
    scope: options.scope ?? 'invariant',
    condition: { id: options.under ?? 'success' },
    substrate: options.substrate,
    seenIn: options.seenIn,
    requires: options.requires,
    oracleSpec: oracle,
  });
}
