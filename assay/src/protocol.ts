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
import { accessControl } from './archetypes/access-control';
import { credentialAuthority } from './archetypes/credential-authority';
import { resourceUniqueness } from './archetypes/resource-uniqueness';
import { submissionGate } from './archetypes/submission-gate';
import { tokenRotation } from './archetypes/token-rotation';
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
 *
 * The version constant lives in core/types.ts (every Verdict is stamped with it);
 * re-exported here because the protocol surface is where readers look for it.
 */
export { PROTOCOL_VERSION } from './core/types';
import { PROTOCOL_VERSION } from './core/types';

/** Every archetype the implementation ships. Adding one here is adding it to the protocol. */
export const ARCHETYPES: readonly Archetype[] = [
  actionEffect,
  dataHonesty,
  personaVisibility,
  navigationIntegrity,
  mountStability,
  authorization,
  accessControl,
  integrationIntegrity,
  secondOrderEffects,
  moneyIntegrity,
  lifecycleGate,
  temporalIntegrity,
  paginationIntegrity,
  renderResilience,
  requestIdempotency,
  credentialAuthority,
  tokenRotation,
  resourceUniqueness,
  submissionGate,
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

/**
 * One-line human description per archetype, serialized into the catalogs so a consumer
 * of the JSON knows what each feature class guards without opening the source. Kept in
 * ONE map (not 39 authoring-site edits); the drift-guard regen carries it into the
 * artifacts. `substrate` on each criterion is the machine-readable reach.
 */
const DESCRIPTIONS: Record<string, string> = {
  'action-effect': 'An action produces its real effect — no visible control is a no-op, failures tell the truth.',
  'data-honesty': 'Rendered data traces to a real source — never fixtures, stock media, or invented rows.',
  'persona-scoped-visibility': 'An actor sees and reaches only the affordances/routes of its role.',
  'navigation-integrity': 'Every affordance leads somewhere real — no dead ends, loops, or ghost params.',
  'mount-stability': 'Mounting is quiet and convergent — no request storms or render loops.',
  'authorization': 'A caller acts only on resources it owns, with the role the operation implies.',
  'access-control': 'A protected endpoint refuses unauthenticated callers.',
  'integration-integrity': 'External callbacks are verified, resolvable, and bound to the real environment.',
  'second-order-effects': 'A state transition fires ALL its downstream effects (every party notified).',
  'money-integrity': 'Money is exact at rest and in display — splits sum to the whole, no float artifacts.',
  'lifecycle-gate': 'A transition is gated on its real preconditions, server-side, with the FE disabled+explained.',
  'temporal-integrity': "Time renders in the user's zone; date-only values are never zone-shifted.",
  'pagination-integrity': 'Paging the whole list yields every item exactly once.',
  'render-resilience': 'A surface degrades gracefully on bad data — it never white-screens.',
  'request-idempotency': 'A mutation with an idempotency key applies at most once.',
  'credential-authority': 'An auth endpoint denies invalid credentials and issues tokens only on valid ones.',
  'token-rotation': 'Session tokens rotate and expire the way the flow promises.',
  'resource-uniqueness': 'A uniqueness rule holds server-side — duplicates are refused.',
  'submission-gate': 'A body-bearing submission is gated on its precondition; a valid body is never a key past the gate.',
  'token-adherence': 'Every rendered colour/space/radius/font is a design-token value.',
  'theme-parity': 'Every colour resolves through the ACTIVE theme — nothing renders stuck in the other theme.',
  'type-hierarchy': 'Heading/type sizes step down the scale in order.',
  'composition-canonical': 'Landmark slots are built from the canonical DS components.',
  'state-coverage': 'Interactive states (disabled/loading/…) are visually distinct from default.',
  'color-contrast': 'Text clears the WCAG contrast ratio against its effective background.',
  'spacing-rhythm': 'Declared spacing values sit on the spacing scale.',
  'accessible-name': 'Every control exposes an accessible name.',
  'image-alt': 'Every meaningful image has a text alternative.',
  'input-purpose': 'Personal-data fields declare their purpose (autocomplete).',
  'layout-integrity': 'No unintended overflow or overlap in the real layout.',
  'layer-integrity': 'Layered regions (modals, dropdowns) stack and occlude correctly.',
  'responsive-integrity': 'The layout holds across the declared breakpoints without horizontal overflow.',
  'reading-order-integrity': 'Visual order matches DOM/reading order.',
  'rtl-integrity': 'The layout mirrors correctly under RTL.',
  'tap-target-integrity': 'Touch targets meet the minimum hit area.',
  'layout-shift-integrity': 'Loading→loaded transitions do not shift settled content.',
  'focus-visible-integrity': 'Keyboard focus is visible on every interactive element.',
  'truncation-integrity': 'Text truncates by design, never by accident.',
  'icon-correctness': "An icon's meaning fits the action it decorates (model-judged).",
};

/** An archetype's serializable spec + its catalog description. */
const withDescription = (a: Archetype): Specification =>
  DESCRIPTIONS[a.name] ? { ...a.spec, description: a.spec.description ?? DESCRIPTIONS[a.name] } : a.spec;

/** Builds the machine-readable protocol catalog from the shipped behaviour archetypes. */
export function buildCatalog(): ProtocolCatalog {
  return {
    protocol: 'AVP',
    protocolVersion: PROTOCOL_VERSION,
    conditionAxes: CONDITION_AXES,
    oracleKinds: ORACLE_KINDS,
    archetypes: ARCHETYPES.map(withDescription),
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
    archetypes: DESIGN_ARCHETYPES.map(withDescription),
  };
}
