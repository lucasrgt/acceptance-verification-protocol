// Assay public surface — authoring API + types + the archetype library.
// Assay is the reference implementation of AVP (the Acceptance Verification Protocol).
export * from './core/dsl';
export * from './core/types';
export { runVerification, type VerifyHooks } from './core/run';
export { buildCatalog, ARCHETYPES, PROTOCOL_VERSION, type ProtocolCatalog } from './protocol';
export { formatVerdict } from './core/format';
export { actionEffect, type ActionEffectExpect } from './archetypes/action-effect';
export { dataHonesty, type DataHonestyExpect } from './archetypes/data-honesty';
export { personaVisibility, type PersonaExpect } from './archetypes/persona-visibility';
export { navigationIntegrity, type NavigationExpect } from './archetypes/navigation-integrity';
export { mountStability, type MountStabilityExpect } from './archetypes/mount-stability';
export { authorization, type AuthorizationExpect } from './archetypes/authorization';
export { integrationIntegrity, type IntegrationExpect } from './archetypes/integration-integrity';
export { secondOrderEffects, type SecondOrderExpect } from './archetypes/second-order-effects';
export { moneyIntegrity, type MoneyExpect } from './archetypes/money-integrity';
export { lifecycleGate, type LifecycleGateExpect } from './archetypes/lifecycle-gate';
