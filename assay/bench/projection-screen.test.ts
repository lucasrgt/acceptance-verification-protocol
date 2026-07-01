import { describe, it, expect, beforeEach } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { actionEffect } from '../src/archetypes/action-effect';
import type { ActionEffectSubject } from '../src/adapter-react/subject';
import {
  GoodMutationScreen,
  GoodProjectionScreen,
  BadMutationScreen,
  BadProjectionScreen,
  resetProjectionStore,
} from './dataset/projection-screen';

/**
 * Cross-screen convergence (the roadmap's projection extension): the projection is read on
 * a SECOND screen mounted after the mutation. The BAD variant renders a snapshot frozen at
 * module load — screen A looked right, screen B lies. `projections-converge` must catch it.
 */
const API = 'http://localhost/api';

const subject = (
  render: () => React.ReactElement,
  projectionScreen: () => React.ReactElement,
): ActionEffectSubject => ({
  name: 'cross-screen-count',
  render,
  endpoint: { method: 'DELETE', path: `${API}/items/first` },
  action: { role: 'button', name: /remove first/i },
  projection: { role: 'status', name: /remaining/i },
  projectionScreen,
});

describe('AVP — cross-screen projection convergence', () => {
  beforeEach(() => resetProjectionStore());

  it('fails the BAD pair: the second screen renders a stale module snapshot', async () => {
    const v = await verify(actionEffect, subject(BadMutationScreen, BadProjectionScreen));
    const target = v.results.find((r) => r.criterionId === 'projections-converge');
    expect(target?.status, target?.reason).toBe('fail');
    expect(target?.reason).toContain('stale');
  });

  it('passes the GOOD pair: the second screen reads the live shared source', async () => {
    const v = await verify(actionEffect, subject(GoodMutationScreen, GoodProjectionScreen));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
  });
});
