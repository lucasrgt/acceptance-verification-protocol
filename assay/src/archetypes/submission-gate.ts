import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `submission-gate` criteria speak; an adapter implements it. */
export interface SubmissionGateExpect {
  /** The same well-formed body is accepted when ready and refused when the target precondition is unmet. */
  gateEnforcedOnSubmission(): void;
  /** The same endpoint gates on a body-carried target id, accepting ready and rejecting unmet. */
  gateEnforcedOnBodyTarget(): void;
}

/**
 * The `submission-gate` archetype — a body-bearing mutation is still server-gated
 * on its precondition. It is the body-bearing sibling of lifecycle-gate: the ready
 * acceptance proves the body is well formed, so the refusal path proves the gate.
 */
export const submissionGate = archetype('submission-gate', '0.1.0', () => {
  criterion(
    'gate-enforced-on-submission',
    "The server enforces the precondition of a body-bearing submission: the SAME well-formed payload is accepted (2xx) on a resource whose precondition is met (ready) and refused (4xx) on one whose precondition is unmet. The ready acceptance proves the payload is well-formed, so the unmet refusal is the gate firing on the precondition — not the body being rejected. A required body is never a key past the gate; the FE form-gate is a courtesy, the server is the guard. The body-bearing sibling of lifecycle-gate's gate-enforced-server-side, for a mutation a body-less probe cannot reach.",
    { under: 'success', scope: 'invariant' },
    mechanical<SubmissionGateExpect>(async ({ act, expect }) => {
      await act();
      expect.gateEnforcedOnSubmission();
    }),
  );

  criterion(
    'gate-enforced-on-body-target',
    'The server enforces the precondition of a body-bearing mutation where the discriminating resource id is carried in the body, not the URL. Two submissions to the same endpoint carry bodies of the same shape but targeting different resource ids: one whose precondition is met (ready), one whose precondition is unmet. The ready submission is accepted (2xx); the unmet submission is refused (4xx). The gate fires on the body-carried id — FE form-gating is a courtesy; the server is the guard. Covers patterns like POST /charges or POST /request where the target resource is identified by a body field such as transactionId or serviceId.',
    { under: 'success', scope: 'invariant' },
    mechanical<SubmissionGateExpect>(async ({ act, expect }) => {
      await act();
      expect.gateEnforcedOnBodyTarget();
    }),
  );
});
