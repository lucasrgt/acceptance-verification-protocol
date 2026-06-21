import type { ReactElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { act } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from './msw-server';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { MountStabilityExpect } from '../archetypes/mount-stability';

/**
 * Descriptor of a `mount-stability` subject: mount the screen and watch one
 * endpoint for a storm. No action, no navigation — just mount and count.
 */
export interface MountStabilitySubject {
  readonly name: string;
  /** Mounts the screen (anonymous / cold boot, as it loads). */
  readonly render: () => ReactElement;
  /** The endpoint whose request count signals a storm (e.g. the session `/me`). */
  readonly endpoint: { readonly method: string; readonly path: string };
  /** The status the endpoint returns during the watch (default 401 — the anonymous boot). */
  readonly respondStatus?: number;
  /** The most requests a healthy mount may fire (default 3). */
  readonly maxRequests?: number;
}

/** The React adapter's `mount-stability` probe. */
export function mountProbe(subject: MountStabilitySubject): Probe<MountStabilityExpect> {
  let count: number | null = null;

  return {
    async act() {
      cleanup();
      let observed = 0;
      const verb = subject.endpoint.method.toLowerCase() as 'get' | 'post';
      const register = http[verb] as typeof http.get;
      server.use(
        register(subject.endpoint.path, () => {
          observed += 1;
          return new HttpResponse(null, { status: subject.respondStatus ?? 401 });
        }),
      );
      render(subject.render());
      // settle long enough for a storm to manifest (a real loop would exceed this many times over)
      await act(async () => {
        await new Promise((r) => setTimeout(r, 120));
      });
      count = observed;
    },
    expect: {
      settlesWithoutStorm() {
        if (count === null) throw new AvpFail('probe used before act() — call `await act()` first.');
        const max = subject.maxRequests ?? 3;
        if (count > max) {
          throw new AvpFail(
            `Mounting fired ${count} requests to ${subject.endpoint.path} (> ${max}) — a refetch/redirect storm that can freeze the screen. Pin the query static (staleTime/no refetch-on-mount) or break the guard→refetch loop.`,
            { count, max },
          );
        }
      },
    },
  };
}

/** The React adapter's hooks for the `mount-stability` archetype. */
export function mountStabilityHooks(subject: MountStabilitySubject): VerifyHooks {
  return { probe: () => mountProbe(subject) };
}
