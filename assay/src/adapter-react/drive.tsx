import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from './msw-server';
import type { ActionEffectSubject } from './subject';
import type { Condition } from '../core/types';
import { settle } from './settle';

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

/**
 * Forces `condition` on the subject's endpoint, mounts, types the draft (if any),
 * snapshots the projection, activates the control, and lets the effects settle.
 * Handles the fault, data and recovery condition axes (see ConditionId).
 */
// Handlers the PREVIOUS drive() registered. Each drive removes its predecessor's before
// registering its own, so criteria inside one verify() never see a stale condition handler —
// while baseline handlers a host `setup()` registered are preserved.
let previousDriveHandlers: ReadonlyArray<unknown> = [];

export async function drive(subject: ActionEffectSubject, condition: Condition): Promise<Driven> {
  cleanup(); // unmount any previous render (several criteria within one verify)

  if (previousDriveHandlers.length > 0) {
    const keep = server.listHandlers().filter((h) => !previousDriveHandlers.includes(h));
    server.resetHandlers(...(keep as Parameters<typeof server.resetHandlers>));
  }

  const requests: ReqRecord[] = [];
  let refreshed = false;
  let refreshCount = 0;
  // double-activate: the FIRST request is held in flight until the second activation has
  // happened, so a guarded control provably had time to disable — a gate, not a timing race.
  let releaseFirstRequest!: () => void;
  const firstRequestGate = new Promise<void>((r) => (releaseFirstRequest = r));

  const verb = subject.endpoint.method.toLowerCase() as 'post' | 'get' | 'put' | 'delete' | 'patch';
  const register = http[verb] as typeof http.post;
  const endpointHandler = register(subject.endpoint.path, async ({ request }) => {
    const body = await safeJson(request);
    const base = { method: request.method, url: request.url, body };

    // recovery axis: an expired token 401s until a refresh has happened.
    if (condition.id === 'token-expired' && !refreshed) {
      requests.push({ ...base, status: 401 });
      return new HttpResponse(null, { status: 401 });
    }
    if (condition.id === 'slow') await delay(50);
    if (condition.id === 'double-activate') await firstRequestGate;
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
  });
  server.use(endpointHandler);
  const ownHandlers: unknown[] = [endpointHandler];

  if (subject.refreshEndpoint) {
    const rverb = subject.refreshEndpoint.method.toLowerCase() as 'post' | 'get';
    const rregister = http[rverb] as typeof http.post;
    const refreshHandler = rregister(subject.refreshEndpoint.path, () => {
      refreshed = true;
      refreshCount += 1;
      return HttpResponse.json({ token: 'refreshed' });
    });
    server.use(refreshHandler);
    ownHandlers.push(refreshHandler);
  }
  previousDriveHandlers = ownHandlers;

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
    // Two activations in quick succession. The FIRST request is gated in flight until the
    // second click has landed (deterministic — no delay race): a correct guard disabled the
    // control after click one, so click two is a no-op; only then is the request released.
    await trigger();
    await trigger();
    releaseFirstRequest();
    await settle(60);
  } else {
    releaseFirstRequest(); // gate only matters under double-activate; never hold otherwise
    await trigger();
    await settle(60);
    // interaction axis: a retry activates the SAME action again on the same mount.
    if (condition.id === 'retry') {
      await trigger();
      await settle(60);
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
