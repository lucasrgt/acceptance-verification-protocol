import type { Archetype } from './core/dsl';
import type { Specification, Substrate } from './core/types';
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
import { paginationIntegrity } from './archetypes/pagination-integrity';
import { renderResilience } from './archetypes/render-resilience';
import { requestIdempotency } from './archetypes/request-idempotency';
import { tokenAdherence } from './archetypes/token-adherence';
import { themeParity } from './archetypes/theme-parity';
import { typeHierarchy } from './archetypes/type-hierarchy';
import { compositionCanonical } from './archetypes/composition-canonical';
import { stateCoverage } from './archetypes/state-coverage';
import { colorContrast } from './archetypes/color-contrast';
import { spacingRhythm } from './archetypes/spacing-rhythm';
import { accessibleName } from './archetypes/accessible-name';
import { imageAlt } from './archetypes/image-alt';
import { inputPurpose } from './archetypes/input-purpose';
import { layoutIntegrity } from './archetypes/layout-integrity';
import { layerIntegrity } from './archetypes/layer-integrity';
import { responsiveIntegrity } from './archetypes/responsive-integrity';
import { readingOrderIntegrity } from './archetypes/reading-order-integrity';
import { rtlIntegrity } from './archetypes/rtl-integrity';
import { tapTargetIntegrity } from './archetypes/tap-target-integrity';
import { layoutShiftIntegrity } from './archetypes/layout-shift-integrity';
import { focusVisibleIntegrity } from './archetypes/focus-visible-integrity';
import { truncationIntegrity } from './archetypes/truncation-integrity';
import { iconCorrectness } from './archetypes/icon-correctness';

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
  paginationIntegrity,
  renderResilience,
  requestIdempotency,
];

/**
 * Every DESIGN archetype the implementation ships — the design tier of AVP (same protocol,
 * a sibling archetype catalog). Verified through the SAME neutral core as the behaviour
 * archetypes, on the design substrates (style/geometry/model). Adding one here adds it to the
 * design catalog.
 */
export const DESIGN_ARCHETYPES: readonly Archetype[] = [
  tokenAdherence,
  themeParity,
  typeHierarchy,
  compositionCanonical,
  stateCoverage,
  colorContrast,
  spacingRhythm,
  accessibleName,
  imageAlt,
  inputPurpose,
  layoutIntegrity,
  layerIntegrity,
  responsiveIntegrity,
  readingOrderIntegrity,
  rtlIntegrity,
  tapTargetIntegrity,
  layoutShiftIntegrity,
  focusVisibleIntegrity,
  truncationIntegrity,
  iconCorrectness,
];

/** The condition vocabulary, by axis — the preconditions an adapter must be able to force. */
export const CONDITION_AXES = {
  fault: ['success', 'api-error', 'slow', 'offline'],
  data: ['empty', 'partial'],
  interaction: ['retry', 'double-activate', 'token-expired'],
} as const;

/** What can decide a criterion. */
export const ORACLE_KINDS = ['mechanical', 'model', 'human'] as const;

/**
 * The substrate vocabulary — the layered-determinism axis (the engine a criterion needs).
 * The behaviour catalog runs on `dom`/`http`; the design catalog adds `style` (jsdom computed
 * style), `geometry` (a real browser), and `model` (an LLM judge); `static` is the host doctor.
 */
export const SUBSTRATES: readonly Substrate[] = ['static', 'dom', 'http', 'style', 'geometry', 'model'];

export interface ProtocolCatalog {
  readonly protocol: 'AVP';
  readonly protocolVersion: string;
  readonly conditionAxes: typeof CONDITION_AXES;
  readonly oracleKinds: readonly string[];
  /** One serializable Specification per archetype (id, statement, oracle, scope, condition, seenIn). */
  readonly archetypes: readonly Specification[];
}

/** Builds the machine-readable protocol catalog from the shipped behaviour archetypes. */
export function buildCatalog(): ProtocolCatalog {
  return {
    protocol: 'AVP',
    protocolVersion: PROTOCOL_VERSION,
    conditionAxes: CONDITION_AXES,
    oracleKinds: ORACLE_KINDS,
    archetypes: ARCHETYPES.map((a) => a.spec),
  };
}

/** The design tier's portable catalog — the same shape plus the substrate axis each design criterion declares. */
export interface DesignProtocolCatalog {
  readonly protocol: 'AVP';
  readonly protocolVersion: string;
  readonly catalog: 'design';
  readonly substrates: readonly string[];
  readonly oracleKinds: readonly string[];
  /** One serializable Specification per design archetype (each criterion carries its `substrate`). */
  readonly archetypes: readonly Specification[];
}

/**
 * Builds the machine-readable DESIGN catalog from the shipped design archetypes — the portable
 * contract a design adapter in any language (Assay.NET, a Rails adapter) implements, binding
 * hooks to each criterion's substrate (style/geometry/model). Drift-guarded against
 * `protocol/design-catalog.json` exactly like the behaviour catalog.
 */
export function buildDesignCatalog(): DesignProtocolCatalog {
  return {
    protocol: 'AVP',
    protocolVersion: PROTOCOL_VERSION,
    catalog: 'design',
    substrates: SUBSTRATES,
    oracleKinds: ORACLE_KINDS,
    archetypes: DESIGN_ARCHETYPES.map((a) => a.spec),
  };
}
