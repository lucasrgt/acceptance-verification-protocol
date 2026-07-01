import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { AuthorizationExpect } from '../archetypes/authorization';
import type { HttpAuthSubject } from './subject';
import { deepEqual, ok, refused, sendJson, sendStatus } from './wire';

/**
 * The HTTP adapter's `authorization` probe. Fires whichever cross-cutting requests
 * the subject declares — a cross-account request (ownership) and/or a privileged
 * request made as the wrong role — and judges the statuses. A 2xx where a refusal
 * was due is an authorization escape; a 5xx is a crash, which is NOT a refusal.
 */
export function httpProbe(subject: HttpAuthSubject): Probe<AuthorizationExpect> {
  let ownerStatus: number | null = null;
  let privStatus: number | null = null;
  let recorded: unknown[] | null = null;

  // Called after the 2xx escape check: a non-2xx only counts when it is a DELIBERATE
  // rejection (rejectWith, or any 4xx) — a 5xx crash must never pass as authorization.
  const mustRefuse = (status: number, what: string): void => {
    if (refused(status, subject.rejectWith)) return;
    const canonical = subject.rejectWith ?? [];
    throw new AvpFail(
      `${what} returned ${status} — a crash/unexpected status is not a refusal. The endpoint must deliberately reject (${canonical.length ? canonical.join('/') : '4xx'}), not fall over.`,
      { status },
    );
  };

  return {
    async act() {
      if (subject.request) ownerStatus = await sendStatus(subject.request);
      if (subject.privileged) privStatus = await sendStatus(subject.privileged);
      if (subject.writes) {
        const read = subject.readRecorded ?? ((b) => b);
        recorded = [];
        for (const w of subject.writes) recorded.push(read((await sendJson(w)).body));
      }
    },
    expect: {
      ownResourceOnly() {
        if (ownerStatus === null) throw new AvpFail('probe used before act() — no cross-account request declared.');
        if (ok(ownerStatus)) {
          throw new AvpFail(
            `Calling as one account, another account's resource returned ${ownerStatus} (success) — a cross-account access (IDOR). Scope the lookup to the caller; a foreign id must be refused (${(subject.rejectWith ?? [401, 403, 404]).join('/')}).`,
            { status: ownerStatus },
          );
        }
        mustRefuse(ownerStatus, "a cross-account request for another account's resource");
      },
      roleRequired() {
        if (privStatus === null) throw new AvpFail('probe used before act() — no privileged request declared.');
        if (ok(privStatus)) {
          throw new AvpFail(
            `A privileged operation succeeded (${privStatus}) when called as a role that should not have it — "any authenticated" is not a policy. Enforce the role the operation implies (expect 401/403).`,
            { status: privStatus },
          );
        }
        mustRefuse(privStatus, 'a privileged operation called by a lesser role');
      },
      serverIsAuthoritative() {
        if (recorded === null) throw new AvpFail('probe used before act() — no authority writes declared.');
        // Structural comparison — key order must never flip the verdict.
        const trusted = recorded
          .map((r, i) => ({ i, r }))
          .filter(({ r }) => !deepEqual(r, subject.serverTruth));
        if (trusted.length > 0) {
          const { i, r } = trusted[0];
          throw new AvpFail(
            `The server recorded a client-sent value (write #${i} → ${JSON.stringify(r)}) instead of its own truth (${JSON.stringify(subject.serverTruth)}) — a client can dictate price/version/quantity. Resolve the authoritative value server-side and ignore the client's word for it.`,
            { recorded, serverTruth: subject.serverTruth },
          );
        }
      },
    },
  };
}

/** The HTTP adapter's hooks for the `authorization` archetype. */
export function authHooks(subject: HttpAuthSubject): VerifyHooks {
  return {
    probe: () => httpProbe(subject),
    applies: (c) => {
      if (c.requires === 'ownership' && !subject.request) return 'Subject declares no cross-account request — not applicable.';
      if (c.requires === 'role' && !subject.privileged) return 'Subject declares no privileged request — not applicable.';
      if (c.requires === 'authority' && !subject.writes) return 'Subject declares no authority writes — not applicable.';
      return null;
    },
  };
}
