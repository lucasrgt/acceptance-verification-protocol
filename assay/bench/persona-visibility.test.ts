import type { ReactElement } from 'react';
import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { personaVisibility } from '../src/archetypes/persona-visibility';
import type { PersonaSubject } from '../src/adapter-react/persona-visibility';
import { GoodSettings, BadSettings, GoodDashboardFree, BadDashboardFree } from './dataset/persona-views';

/**
 * The transfer benchmark (RQ4). The SAME criterion, mined from a marketplace's
 * persona leak, also catches a SaaS's tier leak — two independent projects, one
 * invariant. Green here is the strongest evidence the catalog isn't overfit to one
 * codebase.
 */
const settings = (render: () => ReactElement): PersonaSubject => ({
  name: 'persona-settings',
  actor: 'traveler',
  render,
  foreignAffordances: [{ actor: 'host', role: 'button', name: /switch to host/i }],
});

const tier = (render: () => ReactElement): PersonaSubject => ({
  name: 'tier-dashboard',
  actor: 'free',
  render,
  foreignAffordances: [{ actor: 'pro', role: 'region', name: /market value/i }],
});

const cases = [
  { label: 'persona (marketplace)', source: '16c6cd43', good: settings(GoodSettings), bad: settings(BadSettings) },
  { label: 'tier (SaaS)', source: 'projf:5512811', good: tier(GoodDashboardFree), bad: tier(BadDashboardFree) },
];

describe('AVP — verifier accuracy (persona-scoped-visibility, cross-project)', () => {
  for (const c of cases) {
    it(`fails the BAD ${c.label} on "no-cross-persona-affordance" (escape ${c.source})`, async () => {
      const v = await verify(personaVisibility, c.bad);
      const target = v.results.find((r) => r.criterionId === 'no-cross-persona-affordance');
      expect(target, 'criterion missing').toBeDefined();
      expect(target?.status, target?.reason).toBe('fail');
    });

    it(`passes the GOOD ${c.label} with no false alarm`, async () => {
      const v = await verify(personaVisibility, c.good);
      const fails = v.results.filter((r) => r.status === 'fail');
      expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
      expect(v.acceptanceScore).toBe(1);
    });
  }

  it('emits the persona-visibility transfer number', async () => {
    let detected = 0;
    let falseAlarms = 0;
    for (const c of cases) {
      const bad = await verify(personaVisibility, c.bad);
      const good = await verify(personaVisibility, c.good);
      if (bad.results.find((r) => r.criterionId === 'no-cross-persona-affordance')?.status === 'fail') detected++;
      if (good.results.some((r) => r.status === 'fail')) falseAlarms++;
    }
     
    console.log(`\n[AVP] persona-visibility (cross-project) detection=${detected}/${cases.length}  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(cases.length);
    expect(falseAlarms).toBe(0);
  });
});
