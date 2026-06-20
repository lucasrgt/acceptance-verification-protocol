import type { ReactElement } from 'react';

/**
 * Descriptor of a design subject — the seams the design adapter needs to verify a
 * surface against the design system. Minimal for `token-adherence`: just mount it.
 * The ground truth (the token scale) is the system itself (src/design/tokens.ts),
 * not a per-subject declaration — exactly the point: the verifier is the design system.
 */
export interface ReactDesignSubject {
  readonly name: string;
  /** Mounts the surface to inspect. */
  readonly render: () => ReactElement;
}
