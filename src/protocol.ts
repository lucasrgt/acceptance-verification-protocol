import type { Archetype } from './core/dsl';
import type { Specification } from './core/types';
import { actionEffect } from './archetypes/action-effect';
import { dataHonesty } from './archetypes/data-honesty';
import { personaVisibility } from './archetypes/persona-visibility';
import { navigationIntegrity } from './archetypes/navigation-integrity';
import { mountStability } from './archetypes/mount-stability';
import { authorization } from './archetypes/authorization';
import { integrationIntegrity } from './archetypes/integration-integrity';
import { secondOrderEffects } from './archetypes/second-order-effects';
import { moneyIntegrity } from './archetypes/money-integrity';
import { lifecycleGate } from './archetypes/lifecycle-gate';
import { temporalIntegrity } from './archetypes/temporal-integrity';

/**
 * The PROTOCOL surface — the language-neutral truth, emitted FROM the archetypes so
 * it can never lag the implementation. AVP is the protocol; Assay is one
 * implementation. The catalog below is the portable contract any other
 * implementation (Assay.NET, a Rails adapter, …) verifies against — and the
 * drift-guard test asserts this artifact stays in lockstep with the archetypes the
 * lib actually ships (see bench/protocol-sync.test.ts + protocol/catalog.json).
 */
export const PROTOCOL_VERSION = '0.1.0';

/** Every archetype the implementation ships. Adding one here is adding it to the protocol. */
export const ARCHETYPES: readonly Archetype[] = [
  actionEffect,
  dataHonesty,
  personaVisibility,
  navigationIntegrity,
  mountStability,
  authorization,
  integrationIntegrity,
  secondOrderEffects,
  moneyIntegrity,
  lifecycleGate,
  temporalIntegrity,
];

/** The condition vocabulary, by axis — the preconditions an adapter must be able to force. */
export const CONDITION_AXES = {
  fault: ['success', 'api-error', 'slow', 'offline'],
  data: ['empty', 'partial'],
  interaction: ['retry', 'double-activate', 'token-expired'],
} as const;

/** What can decide a criterion. */
export const ORACLE_KINDS = ['mechanical', 'model', 'human'] as const;

export interface ProtocolCatalog {
  readonly protocol: 'AVP';
  readonly protocolVersion: string;
  readonly conditionAxes: typeof CONDITION_AXES;
  readonly oracleKinds: readonly string[];
  /** One serializable Specification per archetype (id, statement, oracle, scope, condition, seenIn). */
  readonly archetypes: readonly Specification[];
}

/** Builds the machine-readable protocol catalog from the shipped archetypes. */
export function buildCatalog(): ProtocolCatalog {
  return {
    protocol: 'AVP',
    protocolVersion: PROTOCOL_VERSION,
    conditionAxes: CONDITION_AXES,
    oracleKinds: ORACLE_KINDS,
    archetypes: ARCHETYPES.map((a) => a.spec),
  };
}
