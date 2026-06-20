// Assay HTTP adapter — verifies backend archetypes over the wire (language-neutral).
// It rides the HTTP substrate the way the React adapter rides the DOM; both plug
// into the same neutral core runner (src/core/run.ts).
export { verifyHttp } from './verify';
export { httpProbe } from './probe';
export { webhookProbe } from './integration';
export { notifyProbe } from './second-order';
export { moneyProbe } from './money';
export type { HttpAuthSubject, HttpWebhookSubject, HttpNotifySubject, HttpMoneySubject, HttpRequestSpec } from './subject';
