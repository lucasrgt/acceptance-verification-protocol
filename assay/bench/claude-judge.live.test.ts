import { describe, it, expect } from 'vitest';
import { claudeJudge } from '../src/judge/claude';

/**
 * LIVE calibration of the model oracle — the fake-client tests prove the wiring; only a
 * real call measures whether the judge JUDGES. Gated on ANTHROPIC_API_KEY (skipped
 * otherwise — CI without the secret stays honest, a machine with it calibrates for real).
 * Two poles of the error-is-specific rubric: an unmistakable PASS and an unmistakable FAIL.
 */
const hasKey = !!process.env.ANTHROPIC_API_KEY;

describe.skipIf(!hasKey)('claudeJudge — LIVE calibration (needs ANTHROPIC_API_KEY)', () => {
  const judge = claudeJudge();
  const criterion = {
    id: 'error-is-specific',
    statement: 'On failure, the error names the real problem and a next step.',
    rubric:
      'Read the visible text after a failed action. PASS if the error message identifies what failed and suggests a next step; FAIL if it is generic, absent, or blames the user.',
  };

  it('passes an unmistakably specific error message', async () => {
    const v = await judge({
      criterion,
      evidence: { text: 'Could not send your message: the server rejected the attachment (over 10 MB). Remove or compress the attachment and try again.' },
    });
    expect(v.pass, v.reason).toBe(true);
    expect(v.model).toBeTruthy();
  }, 60000);

  it('fails an unmistakably generic error message', async () => {
    const v = await judge({
      criterion,
      evidence: { text: 'Something went wrong.' },
    });
    expect(v.pass, v.reason).toBe(false);
  }, 60000);
});
