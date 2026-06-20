import type { ReactElement } from 'react';

/**
 * Descriptor of an `action-effect` subject: the SEAMS AVP needs to observe
 * behavior. It is not invasive — it declares what already exists (how to mount,
 * which domain endpoint, which control the user activates, which input holds the
 * draft). On a Lazuli app those seams come for free (data door, generated client).
 */
export interface ActionEffectSubject {
  readonly name: string;
  /** Mounts the component (already wrapped in whatever providers it needs). */
  readonly render: () => ReactElement;
  /** The domain effect the action MUST produce (the observable request). */
  readonly endpoint: { readonly method: string; readonly path: string };
  /** The control the user activates — queried by role + accessible name. */
  readonly action: { readonly role: string; readonly name: string | RegExp };
  /** Optional input whose draft must survive a failed action. */
  readonly input?: { readonly role: string; readonly name?: string | RegExp };
  /** Text typed into the input before acting. */
  readonly draftSample?: string;
  /** Body returned by the endpoint under the `success` condition (default `{ ok: true }`). Lets the real component consume a realistic response. */
  readonly successResponse?: unknown;
  /** A sibling projection of the mutated data (a list/badge/count) that must reflect a successful mutation. */
  readonly projection?: { readonly role: string; readonly name?: string | RegExp };
  /** The backend's acceptance contract: returns false for a body the endpoint would 400. Enables `request-accepted`. */
  readonly accepts?: (body: unknown) => boolean;
  /** Opt-in: the action is a single logical operation that a retry must not duplicate. Enables `idempotent-retry`. */
  readonly retryable?: boolean;
  /** The token-refresh endpoint a 401 interceptor should call before retrying. Enables `survives-token-refresh`. */
  readonly refreshEndpoint?: { readonly method: string; readonly path: string };
  /** A success affirmation (text the UI shows only on real success). On failure it must NOT appear (no phantom success). */
  readonly successMarker?: { readonly text: string | RegExp };
  /**
   * Optimistic-reconcile seam: a count readout that, after the action, must equal the
   * server's authoritative value (`successResponse` carries it). Enables
   * `optimistic-reconcile`.
   */
  readonly reconcile?: {
    readonly readout: { readonly role: string; readonly name?: string | RegExp };
    /** The server's authoritative count the readout must settle on (no optimistic drift). */
    readonly serverCount: number;
  };
}
