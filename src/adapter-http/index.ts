// Assay HTTP adapter — verifies backend archetypes over the wire (language-neutral).
// It rides the HTTP substrate the way the React adapter rides the DOM; both plug
// into the same neutral core runner (src/core/run.ts).
export { verifyHttp } from './verify';
export { httpProbe } from './probe';
export { webhookProbe } from './integration';
export { notifyProbe } from './second-order';
export type { HttpAuthSubject, HttpWebhookSubject, HttpNotifySubject, HttpRequestSpec } from './subject';
