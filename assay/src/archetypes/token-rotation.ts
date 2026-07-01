import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `token-rotation` criteria speak; an adapter implements it. */
export interface TokenRotationExpect {
  /** A refresh exchange minted a new refresh token instead of reusing the old one. */
  rotatesOnRefresh(): void;
  /** Replaying a spent refresh token was rejected and burned the token family. */
  replayBurnsFamily(): void;
}

/** The `token-rotation` archetype — refresh-token rotation and replay detection. */
export const tokenRotation = archetype('token-rotation', '0.1.0', () => {
  criterion(
    'rotates-on-refresh',
    'Exchanging a valid refresh token mints a NEW refresh token (rotation), never reissues the same one.',
    { under: 'success', scope: 'invariant' },
    mechanical<TokenRotationExpect>(async ({ act, expect }) => {
      await act();
      expect.rotatesOnRefresh();
    }),
  );

  criterion(
    'replay-burns-family',
    'Replaying an already-rotated (spent) refresh token is rejected AND revokes the whole token family — a leaked token cannot outlive its rotation (theft detection).',
    { under: 'double-activate', scope: 'invariant' },
    mechanical<TokenRotationExpect>(async ({ act, expect }) => {
      await act();
      expect.replayBurnsFamily();
    }),
  );
});
