import type { ReactElement } from 'react';
import type { DesignTheme } from '../design/tokens';

/**
 * Descriptor of a design subject — the seams the design adapter needs to verify a
 * surface against the design system. The ground truth (the token scale) is the system
 * itself (src/design/tokens.ts), not a per-subject declaration — the verifier IS the
 * design system. Each archetype reads the seam it needs.
 */
export interface ReactDesignSubject {
  readonly name: string;
  /** Mounts the surface in a single theme (token-adherence). */
  readonly render?: () => ReactElement;
  /** Mounts the surface for a given theme (theme-parity) — the adapter renders it under each theme. */
  readonly renderTheme?: (theme: DesignTheme) => ReactElement;
  /**
   * Expected composition (composition-canonical): the ordered landmark slots and the
   * canonical DS component each must be. The adapter reads `[data-slot]` elements and
   * their `data-ds` marker from the rendered surface.
   */
  readonly composition?: ReadonlyArray<{ readonly slot: string; readonly component: string }>;
  /** Interactive states to check (state-coverage), e.g. `['disabled', 'loading']` — `default` is always the baseline. */
  readonly states?: readonly string[];
  /** Mounts the surface in a given state (state-coverage) — the adapter renders `default` + each declared state and compares. */
  readonly renderState?: (state: string) => ReactElement;
}
