import { describe, it, expect } from 'vitest';
import { archetype, criterion, mechanical } from '../src/core/dsl';
import { runVerification } from '../src/core/run';
import { composeVerdicts } from '../src/core/compose';
import { formatVerdict, verdictToJsonLine } from '../src/core/format';
import { PROTOCOL_VERSION } from '../src/core/types';

/** Core invariants that don't need an adapter: the DSL guards, the verdict shape, composition. */

const passing = archetype('t-pass', '1.0.0', () => {
  criterion('always-passes', 'holds', {}, mechanical(async ({ act }) => act()));
});

const failing = archetype('t-fail', '1.0.0', () => {
  criterion('always-fails', 'never holds', {}, mechanical(async () => {
    throw new Error('boom');
  }));
});

const hooks = { probe: () => ({ act: async () => {}, expect: {} }) };

describe('core — DSL guards', () => {
  it('rejects a duplicate criterion id inside one archetype', () => {
    expect(() =>
      archetype('dup', '1.0.0', () => {
        criterion('same-id', 'a', {}, mechanical(async () => {}));
        criterion('same-id', 'b', {}, mechanical(async () => {}));
      }),
    ).toThrow(/declared twice/);
  });
});

describe('core — verdict shape', () => {
  it('stamps versions, counts, and durations; an unexpected error is a FAIL with evidence', async () => {
    const v = await runVerification('s', failing, hooks);
    expect(v.protocolVersion).toBe(PROTOCOL_VERSION);
    expect(v.archetypeVersion).toBe('1.0.0');
    expect(v.applicable).toBe(1);
    expect(v.passed).toBe(0);
    expect(typeof v.durationMs).toBe('number');
    const r = v.results[0];
    expect(r.status).toBe('fail');
    expect(r.reason).toContain('Unexpected error');
    expect((r.evidence as { error: string }).error).toBe('boom');
    expect(typeof r.durationMs).toBe('number');
  });

  it('a vacuous run is inconclusive and has no numerical score', async () => {
    const v = await runVerification('s', passing, {
      probe: hooks.probe,
      applies: () => 'nothing applies here',
    });
    expect(v.outcome).toBe('inconclusive');
    expect(v.acceptanceScore).toBeNull();
    expect(v.applicable).toBe(0);
    expect(formatVerdict(v)).toContain('0 applicable');
    expect(formatVerdict(v)).toContain('nothing applies here'); // skip reasons are shown
  });

  it('verdictToJsonLine emits one parseable NDJSON line', async () => {
    const v = await runVerification('s', passing, hooks);
    const line = verdictToJsonLine(v);
    expect(line).not.toContain('\n');
    expect(JSON.parse(line).subject).toBe('s');
  });
});

describe('core — composeVerdicts (feature verdict)', () => {
  it('merges archetype verdicts into one score with prefixed criterion ids', async () => {
    const a = await runVerification('feature-x', passing, hooks);
    const b = await runVerification('feature-x', failing, hooks);
    const f = composeVerdicts('feature-x', [a, b]);
    expect(f.archetypes).toEqual(['t-pass', 't-fail']);
    expect(f.applicable).toBe(2);
    expect(f.passed).toBe(1);
    expect(f.acceptanceScore).toBe(0.5);
    expect(f.results.map((r) => r.criterionId)).toEqual(['t-pass/always-passes', 't-fail/always-fails']);
  });

  it('refuses an empty composition', () => {
    expect(() => composeVerdicts('s', [])).toThrow();
  });

  it('an unresolved criterion makes an otherwise passing composition inconclusive', async () => {
    const decided = await runVerification('feature-x', passing, hooks);
    const unresolved = await runVerification(
      'feature-x',
      archetype('human-ruler', '1.0.0', () => {
        criterion('review', 'is reviewed', {}, { kind: 'human', note: 'review required' });
      }),
      hooks,
    );

    const feature = composeVerdicts('feature-x', [decided, unresolved]);

    expect(feature.outcome).toBe('inconclusive');
    expect(feature.acceptanceScore).toBe(1);
    expect(feature.unresolved).toBe(1);
  });
});
