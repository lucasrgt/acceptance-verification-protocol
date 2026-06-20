/** A single HTTP request the adapter fires over the wire. */
export interface HttpRequestSpec {
  readonly method: string;
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: unknown;
}

/**
 * `authorization` subject — three independent seams, each gating its own criterion
 * (skipped when absent):
 *  - ownership (`own-resource-only`): a cross-account request that must be refused.
 *  - role (`role-required`): a privileged op called as a lesser role, must be refused.
 *  - authority (`server-is-authoritative`): several writes to the SAME resource that
 *    each send a different client-tampered value; the server must record its own
 *    truth, identical regardless of what the client sent.
 */
export interface HttpAuthSubject {
  readonly name: string;
  /** The cross-account request: as the caller, targeting a foreign resource id (own-resource-only). */
  readonly request?: HttpRequestSpec;
  /** A privileged operation called as a role that should not have it (role-required). */
  readonly privileged?: HttpRequestSpec;
  /** Statuses that count as a correct refusal (default: any non-2xx; 401/403/404 are canonical). */
  readonly rejectWith?: readonly number[];
  /** Authority seam: writes to one resource, each carrying a different client-tampered value. */
  readonly writes?: readonly HttpRequestSpec[];
  /** Authority seam: reads the value the server actually recorded out of a write response. */
  readonly readRecorded?: (body: unknown) => unknown;
  /** Authority seam: the value the server MUST record, regardless of the client-sent value. */
  readonly serverTruth?: unknown;
}

/**
 * `lifecycle-gate` subject: a state transition requested on a resource whose
 * precondition is UNMET (must be refused), and the same transition on a READY
 * resource (must succeed) — so the criterion checks the server enforces the gate,
 * not that it rejects everything.
 */
export interface HttpLifecycleSubject {
  readonly name: string;
  /** The transition on a resource whose precondition is unmet — must be refused. */
  readonly transition: HttpRequestSpec;
  /** The same transition on a ready resource — must succeed. */
  readonly whenReady?: HttpRequestSpec;
  /** Statuses that count as a correct refusal (default: any non-2xx; 409/422/403 canonical). */
  readonly rejectWith?: readonly number[];
}

/** A return-URL transition a checkout/OAuth flow must bind. */
export type ReturnTransition = 'success' | 'failure' | 'pending';

/**
 * `integration-integrity` subject — two independent seams, each gating its own
 * criterion (skipped when absent):
 *  - webhook seam (`webhook-signature-verified`): a forged/absent-signature webhook
 *    (must be refused) + a correctly-signed one (must be accepted).
 *  - checkout seam (`redirect-urls-bound`): a checkout/OAuth-create request whose
 *    response carries the return URLs, which must be present for the required
 *    transitions, absolute http(s), and not a placeholder/dev host.
 */
export interface HttpIntegrationSubject {
  readonly name: string;
  /** Webhook seam: a forged/absent-signature callback that must be refused. */
  readonly forged?: HttpRequestSpec;
  /** Webhook seam: a correctly-signed callback that must be accepted. */
  readonly valid?: HttpRequestSpec;
  /** Checkout seam: the checkout/OAuth-create request whose response binds the return URLs. */
  readonly checkout?: HttpRequestSpec;
  /** Checkout seam: reads the return URLs (by transition) out of the checkout response. */
  readonly readReturnUrls?: (body: unknown) => Partial<Record<ReturnTransition, string | null | undefined>>;
  /** Checkout seam: which transitions must be bound (default: success + failure). */
  readonly requiredTransitions?: readonly ReturnTransition[];
  /** Checkout seam (optional, stricter): the app origin every return URL must belong to. */
  readonly expectedOrigin?: string;
  /** Resolve seam: a callback that can't be tied to an entity (missing/unknown ref) — must be refused. */
  readonly unresolvable?: HttpRequestSpec;
  /** Resolve seam: a callback that resolves to a real entity — must be accepted. */
  readonly resolvable?: HttpRequestSpec;
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
 * `request-idempotency` subject: a mutation endpoint that must apply a request
 * carrying an idempotency key at most once. The probe fires the create twice with the
 * SAME key (must yield one resource — the original, replayed) and once with a
 * DIFFERENT key (must yield a distinct resource — the key scopes the dedup).
 */
export interface HttpIdempotencySubject {
  readonly name: string;
  /** Builds a create (mutation) request carrying the given idempotency key. */
  readonly createWithKey: (key: string) => HttpRequestSpec;
  /** Reads the created resource id out of a create response (null if absent). */
  readonly readId: (body: unknown) => string | number | null;
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
