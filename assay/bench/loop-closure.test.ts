import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { actionEffect } from '../src/archetypes/action-effect';
import { pairs } from './pairs';

/**
 * THE LOOP, closed mechanically — the third piece of the core ("we have the signal, we
 * never closed caos→verde"). The generate→verify→fix→green contract is:
 *
 *   1. RED:   the verifier fails the broken build and the reason is ACTIONABLE — it names
 *             what to change, because the fixing agent has nothing else to go on;
 *   2. FIX:   the remediation is applied — here the pair's post-fix variant, which IS the
 *             real fix mined from history (the pre-fix/post-fix pair is the ground truth
 *             of what "the agent fixed it" produces);
 *   3. GREEN: the SAME verifier, unchanged, passes — convergence, not a moved goalpost.
 *
 * An LLM sits in step 2 in production; the harness proves the loop's two verifier legs are
 * sound for every calibrated pair, and that the red verdict carries repair information.
 */
describe('AVP — the caos→verde loop (red verdict → fix → green, same ruler)', () => {
  for (const pair of pairs) {
    it(`${pair.name}: red is actionable, the fix converges to green`, async () => {
      // 1. RED — with an actionable reason (names the problem, not just "failed").
      const red = await verify(actionEffect, pair.bad);
      const failing = red.results.find((r) => r.criterionId === pair.targetCriterion);
      expect(failing?.status).toBe('fail');
      expect(failing?.reason.length ?? 0, 'a red verdict must explain what to fix').toBeGreaterThan(40);
      expect(failing?.reason).not.toMatch(/^Unexpected error/);
      expect(red.acceptanceScore).toBeLessThan(1);

      // 2-3. FIX applied (the mined post-fix build) → the SAME verifier goes green.
      const green = await verify(actionEffect, pair.good);
      expect(green.results.filter((r) => r.status === 'fail')).toHaveLength(0);
      expect(green.acceptanceScore).toBe(1);
    });
  }
});
