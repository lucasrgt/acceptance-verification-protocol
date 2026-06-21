import { describe, it, expect } from 'vitest';
import type { Judge } from '../src/core/dsl';
import { verify } from '../src/adapter-react/verify';
import { actionEffect } from '../src/archetypes/action-effect';
import { pairs } from './pairs';

// The composer (good variant) shows a real error on a failed send — the subject
// the `error-is-specific` model criterion is meant to judge.
const composer = pairs[0].good;

describe('model oracle wiring', () => {
  it('is skipped when no judge is provided', async () => {
    const verdict = await verify(actionEffect, composer);
    const m = verdict.results.find((r) => r.criterionId === 'error-is-specific');
    expect(m?.status).toBe('skipped');
  });

  it('routes the rubric + evidence to the judge and uses its verdict (pass)', async () => {
    const seen: Array<{ rubric: string; text: string }> = [];
    const judge: Judge = (req) => {
      const text = (req.evidence as { text: string }).text;
      seen.push({ rubric: req.criterion.rubric, text });
      return { pass: text.includes('Failed to send'), reason: 'message names the failure' };
    };

    const verdict = await verify(actionEffect, composer, { judge });
    const m = verdict.results.find((r) => r.criterionId === 'error-is-specific');

    expect(seen).toHaveLength(1);
    expect(seen[0].rubric).toContain('PASS if');
    expect(seen[0].text).toContain('Failed to send'); // real evidence gathered from the DOM
    expect(m?.status).toBe('pass');
  });

  it('fails the criterion when the judge fails it', async () => {
    const judge: Judge = () => ({ pass: false, reason: 'too generic' });
    const verdict = await verify(actionEffect, composer, { judge });
    const m = verdict.results.find((r) => r.criterionId === 'error-is-specific');
    expect(m?.status).toBe('fail');
    expect(m?.reason).toBe('too generic');
  });
});
