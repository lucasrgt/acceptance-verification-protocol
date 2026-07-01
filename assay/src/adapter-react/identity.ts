import type { ReactElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from './msw-server';
import { AvpFail, type Probe } from '../core/dsl';
import type { ActionEffectExpect } from '../archetypes/action-effect';
import { settle } from './settle';

/**
 * Descriptor of an `action-effect` IDENTITY subject — the seams to drive a sign-out
 * / sign-in-as-another-account switch and check the prior identity's cached rows are
 * gone. Deliberately distinct from the action subject (which drives one control):
 * here the flow is mount-as-A → switch → and the cache must not feed A's rows to B.
 */
export interface IdentitySubject {
  readonly name: string;
  /** Mounts the app signed in as the first identity. */
  readonly render: () => ReactElement;
  /** The per-identity data endpoint (served by the `x-user` header the app sends). */
  readonly endpoint: { readonly method: string; readonly path: string };
  /** The rows each identity's session should see, keyed by user id (served via `x-user`). */
  readonly responsesByUser: Readonly<Record<string, unknown>>;
  /** The control that switches to the next identity (sign out + sign in as the next account). */
  readonly switchControl: { readonly role: string; readonly name: string | RegExp };
  /** A marker from the PRIOR identity's data — must be ABSENT after the switch. */
  readonly priorMarker: string | RegExp;
  /** A marker from the NEW identity's data — must be PRESENT after the switch. */
  readonly nextMarker: string | RegExp;
}

const present = (marker: string | RegExp): boolean => {
  const text = document.body.textContent ?? '';
  return typeof marker === 'string' ? text.includes(marker) : marker.test(text);
};

const stub = (what: string) => () => {
  throw new AvpFail(`${what} is an action-subject criterion; not applicable to an identity subject.`);
};

/** The React adapter's `action-effect` identity probe (cache-cleared-on-identity). */
export function identityProbe(subject: IdentitySubject): Probe<ActionEffectExpect> {
  let acted = false;
  return {
    async act() {
      cleanup();
      const verb = subject.endpoint.method.toLowerCase() as 'get' | 'post';
      server.use(
        (http[verb] as typeof http.get)(subject.endpoint.path, ({ request }) => {
          const u = request.headers.get('x-user') ?? '';
          return HttpResponse.json((subject.responsesByUser[u] ?? []) as object);
        }),
      );
      const user = userEvent.setup();
      render(subject.render());
      await settle(60); // initial session loads the first identity's rows
      const el = screen.queryByRole(subject.switchControl.role, { name: subject.switchControl.name });
      if (el) await user.click(el);
      await settle(60); // the new identity's session settles
      acted = true;
    },
    expect: {
      cacheClearedOnIdentity() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (present(subject.priorMarker)) {
          throw new AvpFail(
            `After switching identity, the prior account's data ("${String(subject.priorMarker)}") is still shown — a cached row from the previous session fed the new one. Clear the cache on sign-out/sign-in (or key it by identity), so a prior account's rows never reach the next session.`,
            {},
          );
        }
        if (!present(subject.nextMarker)) {
          throw new AvpFail(
            `After switching identity, the new account's data ("${String(subject.nextMarker)}") did not load — clearing the cache must be paired with a refetch for the new identity.`,
            {},
          );
        }
      },
      effectFired: stub('effectFired'),
      draftSurvived: stub('draftSurvived'),
      errorShown: stub('errorShown'),
      projectionConverged: stub('projectionConverged'),
      requestAccepted: stub('requestAccepted'),
      idempotentRetry: stub('idempotentRetry'),
      firesOnce: stub('firesOnce'),
      noFalseSuccess: stub('noFalseSuccess'),
      survivesTokenRefresh: stub('survivesTokenRefresh'),
      optimisticReconcile: stub('optimisticReconcile'),
    },
  };
}

/** True for an identity subject (vs the action subject). */
export function isIdentitySubject(subject: unknown): subject is IdentitySubject {
  return (
    typeof subject === 'object' &&
    subject !== null &&
    typeof (subject as IdentitySubject).responsesByUser === 'object' &&
    (subject as IdentitySubject).responsesByUser !== null
  );
}
