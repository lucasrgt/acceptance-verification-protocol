import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { http, HttpResponse, delay } from 'msw';
import { server } from './msw-server';
import type { ActionEffectSubject } from './subject';
import type { Condition } from '../core/types';

/** One observed request to the subject's endpoint, with the status the seam returned. */
export interface ReqRecord {
  readonly method: string;
  readonly url: string;
  /** The HTTP status the seam returned (0 = network error). */
  readonly status: number;
  /** The parsed request body, if any. */
  readonly body: unknown;
}

/** What can be observed after driving the action under a condition. */
export interface Driven {
  readonly requests: ReadonlyArray<ReqRecord>;
  inputValue(): string | null;
  hasVisibleError(): boolean;
  /** The projection's text snapshotted BEFORE the action. */
  readonly projectionBefore: string | null;
  /** The projection's text now (call after the action settles). */
  projectionText(): string | null;
  /** How many times the token-refresh endpoint was called. */
  refreshCount(): number;
}

async function safeJson(request: Request): Promise<unknown> {
  try {
    return await request.clone().json();
  } catch {
    return undefined;
  }
}

const settle = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 60));
  });

/**
 * Forces `condition` on the subject's endpoint, mounts, types the draft (if any),
 * snapshots the projection, activates the control, and lets the effects settle.
 * Handles the fault, data and recovery condition axes (see ConditionId).
 */
export async function drive(subject: ActionEffectSubject, condition: Condition): Promise<Driven> {
  cleanup(); // unmount any previous render (several criteria within one verify)

  const requests: ReqRecord[] = [];
  let refreshed = false;
  let refreshCount = 0;

  const verb = subject.endpoint.method.toLowerCase() as 'post' | 'get' | 'put' | 'delete' | 'patch';
  const register = http[verb] as typeof http.post;
  server.use(
    register(subject.endpoint.path, async ({ request }) => {
      const body = await safeJson(request);
      const base = { method: request.method, url: request.url, body };

      // recovery axis: an expired token 401s until a refresh has happened.
      if (condition.id === 'token-expired' && !refreshed) {
        requests.push({ ...base, status: 401 });
        return new HttpResponse(null, { status: 401 });
      }
      // double-activate: keep the first request in flight so a guarded control has time
      // to disable before the second activation lands.
      if (condition.id === 'slow' || condition.id === 'double-activate') await delay(50);
      if (condition.id === 'offline') {
        requests.push({ ...base, status: 0 });
        return HttpResponse.error();
      }
      if (condition.id === 'api-error') {
        requests.push({ ...base, status: 500 });
        return new HttpResponse(null, { status: 500 });
      }
      // contract: a body the backend won't accept is a 400 (before any effect).
      if (subject.accepts && !subject.accepts(body)) {
        requests.push({ ...base, status: 400 });
        return new HttpResponse(null, { status: 400 });
      }
      requests.push({ ...base, status: 200 });
      return HttpResponse.json((subject.successResponse ?? { ok: true }) as object);
    }),
  );

  if (subject.refreshEndpoint) {
    const rverb = subject.refreshEndpoint.method.toLowerCase() as 'post' | 'get';
    const rregister = http[rverb] as typeof http.post;
    server.use(
      rregister(subject.refreshEndpoint.path, () => {
        refreshed = true;
        refreshCount += 1;
        return HttpResponse.json({ token: 'refreshed' });
      }),
    );
  }

  const projectionText = (): string | null => {
    if (!subject.projection) return null;
    const el = screen.queryByRole(subject.projection.role, nameOpt(subject.projection.name));
    return el ? (el.textContent ?? '').replace(/\s+/g, ' ').trim() : null;
  };

  const user = userEvent.setup();
  render(subject.render());

  if (subject.input && subject.draftSample != null) {
    await user.type(screen.getByRole(subject.input.role, nameOpt(subject.input.name)), subject.draftSample);
  }

  const projectionBefore = projectionText();
  const trigger = () => user.click(screen.getByRole(subject.action.role, { name: subject.action.name }));

  if (condition.id === 'double-activate') {
    // Two activations in quick succession. The first awaits long enough for a guarded
    // control to commit its disabled state (React re-render); the slow endpoint keeps
    // the first request in flight so a correct guard makes the second a no-op.
    await trigger();
    await trigger();
    await settle();
  } else {
    await trigger();
    await settle();
    // interaction axis: a retry activates the SAME action again on the same mount.
    if (condition.id === 'retry') {
      await trigger();
      await settle();
    }
  }

  return {
    requests,
    inputValue() {
      if (!subject.input) return null;
      const field = screen.queryByRole(subject.input.role, nameOpt(subject.input.name)) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;
      return field ? field.value : null;
    },
    hasVisibleError() {
      return screen.queryAllByRole('alert').some((el) => (el.textContent ?? '').trim().length > 0);
    },
    projectionBefore,
    projectionText,
    refreshCount: () => refreshCount,
  };
}

function nameOpt(name?: string | RegExp) {
  return name ? { name } : undefined;
}
