/** A single HTTP request the adapter fires over the wire. */
export interface HttpRequestSpec {
  readonly method: string;
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: unknown;
}

/**
 * `authorization` subject: a single cross-account request — AS one caller,
 * targeting ANOTHER account's resource — plus what counts as a correct refusal.
 */
export interface HttpAuthSubject {
  readonly name: string;
  /** The cross-account request: as the caller, targeting a foreign resource id (own-resource-only). */
  readonly request?: HttpRequestSpec;
  /** A privileged operation called as a role that should not have it (role-required). */
  readonly privileged?: HttpRequestSpec;
  /** Statuses that count as a correct refusal (default: any non-2xx; 401/403/404 are canonical). */
  readonly rejectWith?: readonly number[];
}

/**
 * `integration-integrity` subject: a forged/absent-signature webhook (must be
 * refused) and a correctly-signed one (must be accepted) — so the criterion checks
 * the server verifies signatures, not that it rejects everything.
 */
export interface HttpWebhookSubject {
  readonly name: string;
  readonly forged: HttpRequestSpec;
  readonly valid: HttpRequestSpec;
}

/**
 * `second-order-effects` subject: a state-transition request, and the inboxes of
 * every party the transition concerns — each must receive a notification.
 */
export interface HttpNotifySubject {
  readonly name: string;
  readonly trigger: HttpRequestSpec;
  readonly inboxes: readonly { readonly party: string; readonly url: string }[];
}
