import { act } from 'react';

/**
 * The ONE place the React-substrate probes wait for effects to flush. Two shapes:
 *
 *  - `settle(0)` (default) — flush microtasks + a macrotask tick (state updates, msw
 *    responses already resolved).
 *  - `settle(ms)` — a DEADLINE, used only where the check is an ABSENCE proof (a no-op
 *    control fires no request; a double-activation must NOT fire twice). Absence needs a
 *    cutoff by nature — no predicate can wait for "nothing". The window is tunable for
 *    slow CI via ASSAY_SETTLE_MS (multiplies the declared deadline).
 */
export const settle = (ms = 0): Promise<void> =>
  act(async () => {
    const scale = Number(process.env.ASSAY_SETTLE_MS_SCALE ?? '1') || 1;
    await new Promise((r) => setTimeout(r, ms * scale));
  });

/**
 * Presence-based wait: polls `ready` inside act() until it holds or the deadline hits.
 * Prefer this over a fixed sleep whenever the condition is observable (an element
 * appeared, a request was recorded) — it settles as fast as the app does.
 */
export async function settleUntil(ready: () => boolean, timeoutMs = 1000, intervalMs = 10): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (ready()) return true;
    await settle(intervalMs);
  }
  return ready();
}
