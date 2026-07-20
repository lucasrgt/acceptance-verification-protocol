// Assay React adapter — the executor, the probes, the MSW seam, the subject types.
export { verify, type VerifyOptions } from './verify';
export { reactProbe } from './probe';
export { dataProbe } from './data-honesty';
export { detailProbe } from './data-detail';
export { personaProbe } from './persona-visibility';
export { navProbe } from './navigation-integrity';
export { routerProbe } from './navigation-router';
export { mountProbe } from './mount-stability';
export { identityProbe, isIdentitySubject } from './identity';
export { server } from './msw-server';
export { settle, settleUntil } from './settle';
// Every subject type a consumer needs to declare its seams, one per archetype family.
export type { ActionDraft, ActionEffectSubject } from './subject';
export type { IdentitySubject } from './identity';
export type { DataHonestySubject } from './data-honesty';
export type { DetailHonestySubject } from './data-detail';
export type { PersonaSubject, ForeignAffordance } from './persona-visibility';
export type { NavigationSubject } from './navigation-integrity';
export type { RouterNavSubject } from './navigation-router';
export type { MountStabilitySubject } from './mount-stability';
export type { ReactLifecycleSubject } from './lifecycle-gate';
export type { ReactTemporalSubject } from './temporal-integrity';
export type { ReactPagingSubject } from './pagination-integrity';
export type { ReactResilienceSubject } from './render-resilience';
export type { ReactMoneySubject } from './money-integrity';
