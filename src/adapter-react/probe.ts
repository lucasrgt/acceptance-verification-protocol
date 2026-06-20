import { AvpFail, type Probe } from '../core/dsl';
import type { Condition } from '../core/types';
import type { ActionEffectExpect } from '../archetypes/action-effect';
import type { ActionEffectSubject } from './subject';
import { drive, type Driven } from './drive';

/**
 * The React adapter's `action-effect` probe: it drives the subject via RTL/MSW and
 * implements the archetype's assertion vocabulary. The RTL/MSW plumbing stays
 * hidden here — archetypes read in acceptance language (`expect.effectFired()`),
 * not test plumbing.
 */
export function reactProbe(subject: ActionEffectSubject, condition: Condition): Probe<ActionEffectExpect> {
  let driven: Driven | null = null;
  const seen = (): Driven => {
    if (!driven) throw new AvpFail('probe used before act() — call `await act()` first.');
    return driven;
  };

  return {
    async act() {
      driven = await drive(subject, condition);
    },
    expect: {
      effectFired() {
        const d = seen();
        const hits = d.requests.filter(
          (r) => r.method.toUpperCase() === subject.endpoint.method.toUpperCase(),
        );
        if (hits.length === 0) {
          throw new AvpFail(
            `No ${subject.endpoint.method} request to ${subject.endpoint.path} after activating "${String(subject.action.name)}". The control may be a no-op — wire the action to its real effect.`,
            { observed: d.requests },
          );
        }
      },
      draftSurvived() {
        const d = seen();
        if (d.inputValue() !== subject.draftSample) {
          throw new AvpFail(
            'The input was cleared even though the action failed (phantom success) — only clear the draft on the success path.',
            { draft: d.inputValue() },
          );
        }
      },
      errorShown() {
        const d = seen();
        if (!d.hasVisibleError()) {
          throw new AvpFail('No error was visible after the failure — surface it to the user (e.g. role="alert").');
        }
      },
      projectionConverged() {
        const d = seen();
        if (d.projectionBefore === null) {
          throw new AvpFail('No projection declared on the subject.');
        }
        const after = d.projectionText();
        if (d.projectionBefore === after) {
          throw new AvpFail(
            `The projection ("${d.projectionBefore}") did not change after a successful mutation — it is stale. Invalidate/refresh the shared source after the mutation.`,
            { before: d.projectionBefore, after },
          );
        }
      },
      requestAccepted() {
        const d = seen();
        const hits = endpointHits(d, subject);
        if (hits.length === 0) {
          throw new AvpFail(
            `No request reached ${subject.endpoint.path} — the action never sent its effect, so nothing could be accepted.`,
            { observed: d.requests },
          );
        }
        const rejected = hits.find((r) => r.status === 400);
        if (rejected) {
          throw new AvpFail(
            `The request the UI sent to ${subject.endpoint.path} was rejected (400): the body doesn't match the contract the backend accepts (e.g. a datetime where a date-only field is expected). Send the shape the endpoint declares.`,
            { rejectedBody: rejected.body },
          );
        }
      },
      idempotentRetry() {
        const d = seen();
        const hits = endpointHits(d, subject);
        if (hits.length === 0) {
          throw new AvpFail(
            `No request reached ${subject.endpoint.path} after activating the action.`,
            { observed: d.requests },
          );
        }
        if (hits.length > 1) {
          throw new AvpFail(
            `A retry duplicated the effect: ${hits.length} requests to ${subject.endpoint.path} for one logical action. Hold the created id and resume the chain on retry — don't re-create.`,
            { count: hits.length },
          );
        }
      },
      noFalseSuccess() {
        seen();
        const m = subject.successMarker;
        if (!m) return; // no-op when the subject declares no success affirmation
        const text = (document.body.textContent ?? '').replace(/\s+/g, ' ');
        const shown = typeof m.text === 'string' ? text.includes(m.text) : m.text.test(text);
        if (shown) {
          throw new AvpFail(
            `After a failed action the UI showed a success affirmation ("${String(m.text)}") — a phantom success. Only confirm success on the success path.`,
            {},
          );
        }
      },
      survivesTokenRefresh() {
        const d = seen();
        if (d.refreshCount() === 0) {
          throw new AvpFail(
            `An expired token (401) was not recovered: the action errored instead of refreshing and retrying. Add a 401 interceptor that refreshes via ${subject.refreshEndpoint?.path ?? 'the refresh endpoint'} and replays the request.`,
            { observed: d.requests },
          );
        }
        const succeeded = endpointHits(d, subject).some((r) => r.status >= 200 && r.status < 300);
        if (!succeeded) {
          throw new AvpFail(
            'The token refreshed but the original action was never replayed — the effect still did not happen. Retry the request after the refresh.',
            { observed: d.requests },
          );
        }
      },
    },
  };
}

/** Requests that hit the subject's domain endpoint (by method). */
function endpointHits(d: Driven, subject: ActionEffectSubject) {
  return d.requests.filter((r) => r.method.toUpperCase() === subject.endpoint.method.toUpperCase());
}
