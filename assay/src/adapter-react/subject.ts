import type { ReactElement } from 'react';

/** One user-editable draft that Assay fills and verifies survives a failed action. */
export interface ActionDraft {
  readonly role: string;
  readonly name?: string | RegExp;
  readonly value: string;
}

/**
 * Descriptor of an `action-effect` subject: the SEAMS AVP needs to observe
 * behavior. It is not invasive — it declares what already exists (how to mount,
 * which domain endpoint, which control the user activates, which input holds the
 * draft). On an AeroFortress app those seams come for free (data door, generated client).
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
  /** Text typed into the legacy single `input` before acting. */
  readonly draftSample?: string;
  /**
   * Every draft a real form needs before the action can reach its effect. On failure,
   * Assay verifies that all declared values survive. Prefer this for multi-field forms;
   * `input` + `draftSample` remains supported for existing single-field subjects.
   */
  readonly inputs?: readonly ActionDraft[];
  /** Body returned by the endpoint under the `success` condition (default `{ ok: true }`). Lets the real component consume a realistic response. */
  readonly successResponse?: unknown;
  /** A sibling projection of the mutated data (a list/badge/count) that must reflect a successful mutation. */
  readonly projection?: { readonly role: string; readonly name?: string | RegExp };
  /**
   * CROSS-SCREEN projection seam: a SECOND screen (another route/surface reading the same
   * shared source) mounted AFTER the action. When declared, `projections-converge` is
   * judged there — the mutation must reach a screen that wasn't even mounted when it
   * happened (a stale client cache/module snapshot is exactly what this catches).
   */
  readonly projectionScreen?: () => ReactElement;
  /** The backend's acceptance contract: returns false for a body the endpoint would 400. Enables `request-accepted`. */
  readonly accepts?: (body: unknown) => boolean;
  /** Opt-in: the action is a single logical operation that a retry must not duplicate. Enables `idempotent-retry`. */
  readonly retryable?: boolean;
  /** Opt-in: the action must be single-flight — a fast double-activation fires the effect once, not twice. Enables `single-flight`. */
  readonly singleFlight?: boolean;
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
