// Assay HTTP adapter — verifies backend archetypes over the wire (language-neutral).
// It rides the HTTP substrate the way the React adapter rides the DOM; both plug
// into the same neutral core runner (src/core/run.ts).
export { verifyHttp } from './verify';
export { httpProbe } from './probe';
export { integrationProbe } from './integration';
export { notifyProbe } from './second-order';
export { moneyProbe } from './money';
export { lifecycleProbe } from './lifecycle';
export { mutationAtomicityProbe } from './mutation-atomicity';
export { failureHonestyProbe } from './failure-honesty';
export type {
  HttpAuthSubject,
  HttpIntegrationSubject,
  HttpNotifySubject,
  HttpMoneySubject,
  HttpLifecycleSubject,
  HttpMutationAtomicitySubject,
  HttpFailureHonestySubject,
  HttpRequestSpec,
  ReturnTransition,
} from './subject';
