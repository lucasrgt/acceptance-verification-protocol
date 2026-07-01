import { describe, it, expect } from 'vitest';
import { claudeJudge, type AnthropicLike } from '../src/judge/claude';
import { verify } from '../src/adapter-react/verify';
import { actionEffect } from '../src/archetypes/action-effect';
import { pairs } from './pairs';

/**
 * The reference Claude judge for the `model` oracle. We don't hit the network: a
 * fake AnthropicLike client captures the request and returns a canned verdict, so
 * the prompt-building, structured-output request, parsing, and fail-closed behaviour
 * are all deterministic. (A live run is exercised only when a real client / API key
 * is supplied.)
 */
const fakeClient = (reply: string, capture?: (args: Record<string, unknown>) => void): AnthropicLike => ({
  messages: {
    create: async (args) => {
      capture?.(args);
      return { content: [{ type: 'text', text: reply }] };
    },
  },
});

describe('claudeJudge — the reference model-oracle judge', () => {
  it('builds a structured-output request carrying the rubric + evidence, and parses the verdict', async () => {
    let sent: Record<string, unknown> | undefined;
    const judge = claudeJudge({
      model: 'claude-opus-4-8',
      client: fakeClient('{"pass": true, "reason": "names the failure and a next step"}', (a) => (sent = a)),
    });

    const verdict = await judge({
      criterion: { id: 'error-is-specific', statement: 'The error names the real problem.', rubric: 'PASS if the message identifies what failed.' },
      evidence: { text: 'Failed to send — check your connection and retry.' },
    });

    expect(verdict).toEqual({ pass: true, reason: 'names the failure and a next step', model: 'claude-opus-4-8' });
    // the request used structured output and carried the rubric + evidence
    expect((sent?.output_config as { format?: { type?: string } })?.format?.type).toBe('json_schema');
    expect(sent?.model).toBe('claude-opus-4-8');
    const userMsg = (sent?.messages as Array<{ content: string }>)[0].content;
    expect(userMsg).toContain('PASS if the message identifies what failed.');
    expect(userMsg).toContain('Failed to send');
  });

  it('fails closed when the model returns an unparseable verdict (a false PASS is the catastrophic error)', async () => {
    const judge = claudeJudge({ client: fakeClient('not json at all') });
    const verdict = await judge({
      criterion: { id: 'x', statement: 's', rubric: 'r' },
      evidence: {},
    });
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toMatch(/fail-closed/i);
  });

  it('fails closed when the client call throws (a judge outage flags, never passes)', async () => {
    const judge = claudeJudge({
      retries: 0, // deterministic: no backoff sleep in the test
      client: {
        messages: {
          create: async () => {
            throw new Error('network down');
          },
        },
      },
    });
    const verdict = await judge({ criterion: { id: 'x', statement: 's', rubric: 'r' }, evidence: {} });
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain('network down');
  });

  it('drives `error-is-specific` end-to-end through verify() with the fake-client judge', async () => {
    const judge = claudeJudge({
      client: fakeClient('{"pass": true, "reason": "the message names the failure"}'),
    });
    const verdict = await verify(actionEffect, pairs[0].good, { judge });
    const m = verdict.results.find((r) => r.criterionId === 'error-is-specific');
    expect(m?.status).toBe('pass');
    expect(m?.reason).toBe('the message names the failure');
  });
});
