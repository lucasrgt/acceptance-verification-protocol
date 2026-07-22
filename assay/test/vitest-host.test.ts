import { describe, expect, it } from 'vitest';
import { requireAccepted } from '../src/adapter-react/vitest';
import type { Verdict } from '../src/core/types';

function verdict(overrides: Partial<Verdict> = {}): Verdict {
  return {
    subject: 'checkout',
    archetype: 'action-effect',
    archetypeVersion: '1.0.0',
    protocolVersion: '0.4.0',
    results: [{ criterionId: 'fires', status: 'pass', reason: 'held' }],
    outcome: 'pass',
    applicable: 1,
    passed: 1,
    unresolved: 0,
    notApplicable: 0,
    acceptanceScore: 1,
    durationMs: 1,
    ...overrides,
  };
}

describe('Vitest host policy', () => {
  it('accepts a conclusive all-pass verdict', () => {
    expect(() => requireAccepted(verdict())).not.toThrow();
  });

  it('rejects any failed criterion; no score threshold can waive it', () => {
    const failed = verdict({
      results: [
        { criterionId: 'fires', status: 'pass', reason: 'held' },
        { criterionId: 'effect', status: 'fail', reason: 'lost' },
      ],
      outcome: 'fail',
      applicable: 2,
      passed: 1,
      acceptanceScore: 0.5,
    });
    expect(() => requireAccepted(failed)).toThrow(/every decided criterion is mandatory/);
  });

  it('rejects an empty verdict even though no criterion failed', () => {
    const empty = verdict({
      results: [{ criterionId: 'fires', status: 'not-applicable', reason: 'wrong subject shape' }],
      outcome: 'inconclusive',
      applicable: 0,
      passed: 0,
      notApplicable: 1,
      acceptanceScore: null,
    });

    expect(() => requireAccepted(empty)).toThrow(/inconclusive/);
  });

  it('rejects an unavailable oracle even when every decided criterion passed', () => {
    const partial = verdict({
      results: [
        { criterionId: 'fires', status: 'pass', reason: 'held' },
        { criterionId: 'semantic-fit', status: 'unresolved', reason: 'judge unavailable' },
      ],
      outcome: 'inconclusive',
      unresolved: 1,
    });

    expect(() => requireAccepted(partial)).toThrow(/judge unavailable/);
  });
});
