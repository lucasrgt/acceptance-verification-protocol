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

/**
 * `money-integrity` subject: an endpoint that splits a total (in cents) into a
 * platform share and a host share, plus the policy fraction in basis points. The
 * probe fires the endpoint over a range of totals and checks the split is exact to
 * the cent and respects the policy — no float-rounding leak.
 */
export interface HttpMoneySubject {
  readonly name: string;
  /** Builds the split request for a given total in cents (POST { totalCents } by convention). */
  readonly splitRequest: (totalCents: number) => HttpRequestSpec;
  /** Reads the platform/host cents out of the response body. */
  readonly readShares: (body: unknown) => { platformCents: number; hostCents: number };
  /** Platform fee in basis points (1500 = 15%). The remainder is the host's payout. */
  readonly platformBps: number;
  /** Totals (in cents) to probe. Include leak-prone and exact cases. */
  readonly totals: readonly number[];
}
