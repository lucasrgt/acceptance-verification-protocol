import type { ReactElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { RenderResilienceExpect } from '../archetypes/render-resilience';

/**
 * Descriptor of a React `render-resilience` subject. Mounts the surface against the
 * empty/null/malformed data it can actually receive; rendering must not throw. The
 * subject's `render` already feeds the edge-case data — the seam just declares how to
 * mount it (and, optionally, the fallback the user should see instead of a crash).
 */
export interface ReactResilienceSubject {
  readonly name: string;
  /** Mounts the surface fed the edge-case (empty/null/malformed) data. */
  readonly render: () => ReactElement;
  /** Optional: text that should appear as the graceful fallback (asserted only when the render survives). */
  readonly fallbackMarker?: string | RegExp;
}

const present = (marker: string | RegExp): boolean => {
  const text = document.body.textContent ?? '';
  return typeof marker === 'string' ? text.includes(marker) : marker.test(text);
};

/** The React adapter's `render-resilience` probe (survives-malformed-data). */
export function resilienceProbe(subject: ReactResilienceSubject): Probe<RenderResilienceExpect> {
  let thrown: Error | null = null;
  let acted = false;
  return {
    async act() {
      cleanup();
      thrown = null;
      try {
        // A crash on a null/empty/malformed field throws synchronously out of render().
        render(subject.render());
      } catch (e) {
        thrown = e as Error;
      }
      acted = true;
    },
    expect: {
      survivesMalformedData() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (thrown) {
          throw new AvpFail(
            `The surface crashed rendering the data it can receive: ${thrown.message}. Guard the null/empty/malformed fields (optional chaining, default empties) and degrade to a fallback — a white screen is the feature not working.`,
            { error: thrown.message },
          );
        }
        if (subject.fallbackMarker && !present(subject.fallbackMarker)) {
          throw new AvpFail(
            `The surface didn't crash but showed no fallback ("${String(subject.fallbackMarker)}") for the degenerate data — render an empty/fallback state so the user sees something, not a blank.`,
            {},
          );
        }
      },
    },
  };
}

/** The React adapter's hooks for `render-resilience`. */
export function resilienceHooks(subject: ReactResilienceSubject): VerifyHooks {
  return {
    probe: () => resilienceProbe(subject),
    applies: () => null,
  };
}
