import { describe, it, expect } from 'vitest';
import type { Archetype } from '../src/core/dsl';
import { verify } from '../src/adapter-react/verify';
import { actionEffect } from '../src/archetypes/action-effect';
import { dataHonesty } from '../src/archetypes/data-honesty';
import { personaVisibility } from '../src/archetypes/persona-visibility';
import { navigationIntegrity } from '../src/archetypes/navigation-integrity';
import { mountStability } from '../src/archetypes/mount-stability';
import {
  actionMutant,
  feedMutant,
  mediaMutant,
  phantomMutant,
  navMutant,
  stormMutant,
  personaMutant,
} from './mutation/mutants';

/**
 * Mutation testing for the CRITERIA (Stryker-like, archetype-aware). For each
 * criterion we generate a family of mutants — distinct ways its failure class can
 * manifest — and require the criterion to KILL every one (fail it) while leaving
 * the healthy variant green (no false alarm). The mutation score is the verifier's
 * robustness: 100% = it catches the whole class, not just one example. A surviving
 * mutant is a HOLE — exactly what hardens the catalog.
 */
const API = 'http://localhost/api';
type Mut = { readonly label: string; readonly subject: { readonly name: string } };
interface MutationSet {
  readonly label: string;
  readonly archetype: Archetype;
  readonly criterionId: string;
  readonly killed: readonly Mut[];
  readonly benign: readonly Mut[];
}

const action = (label: string, fault: Parameters<typeof actionMutant>[0]): Mut => ({
  label,
  subject: { name: `action-${fault}`, render: actionMutant(fault), endpoint: { method: 'POST', path: `${API}/widgets` }, action: { role: 'button', name: /save/i } } as never,
});

const phantom = (label: string, fault: Parameters<typeof phantomMutant>[0]): Mut => ({
  label,
  subject: {
    name: `phantom-${fault}`,
    render: phantomMutant(fault),
    endpoint: { method: 'POST', path: `${API}/widgets` },
    action: { role: 'button', name: /save/i },
    input: { role: 'textbox', name: /note/i },
    draftSample: 'hello',
    successMarker: { text: /saved!/i },
  } as never,
});

const feed = (label: string, fault: Parameters<typeof feedMutant>[0]): Mut => ({
  label,
  subject: { name: `feed-${fault}`, render: feedMutant(fault), endpoint: { method: 'GET', path: `${API}/things` }, items: { role: 'article' }, emptyResponse: [], fabricationMarkers: ['images.unsplash.com'] } as never,
});

const media = (label: string, fault: Parameters<typeof mediaMutant>[0]): Mut => ({
  label,
  subject: { name: `media-${fault}`, render: mediaMutant(fault), endpoint: { method: 'GET', path: `${API}/things` }, items: { role: 'article' }, emptyResponse: [], mediaResponse: [{ id: 'r1', cover: null }], fabricationMarkers: ['images.unsplash.com', 'i.pravatar.cc'] } as never,
});

const nav = (label: string, target: string): Mut => ({
  label,
  subject: { name: `nav-${label}`, render: navMutant(target), affordances: [{ role: 'button', name: /go/i }], registeredRoutes: ['/home', '/settings'] } as never,
});

const storm = (label: string, fault: Parameters<typeof stormMutant>[0]): Mut => ({
  label,
  subject: { name: `storm-${fault}`, render: stormMutant(fault), endpoint: { method: 'GET', path: `${API}/me` }, respondStatus: 401, maxRequests: 3 } as never,
});

const persona = (label: string, fault: Parameters<typeof personaMutant>[0]): Mut => ({
  label,
  subject: { name: `persona-${fault}`, actor: 'traveler', render: personaMutant(fault), foreignAffordances: [{ actor: 'host', role: 'button', name: /switch to host/i }] } as never,
});

const sets: readonly MutationSet[] = [
  {
    label: 'action-effect · fires-primary-effect',
    archetype: actionEffect,
    criterionId: 'fires-primary-effect',
    killed: [action('no-handler', 'no-handler'), action('inert-handler', 'inert-handler'), action('prevent-only', 'prevent-only')],
    benign: [action('wired', 'none')],
  },
  {
    label: 'action-effect · no-phantom-success',
    archetype: actionEffect,
    criterionId: 'no-phantom-success',
    killed: [phantom('draft-cleared', 'draft-cleared'), phantom('no-error', 'no-error'), phantom('false-success', 'false-success')],
    benign: [phantom('honest', 'honest')],
  },
  {
    label: 'data-honesty · no-fixture-fallback',
    archetype: dataHonesty,
    criterionId: 'no-fixture-fallback',
    killed: [feed('array-fixture', 'array-fixture'), feed('single-fixture', 'single-fixture')],
    benign: [feed('honest-empty', 'none')],
  },
  {
    label: 'data-honesty · no-fabricated-media',
    archetype: dataHonesty,
    criterionId: 'no-fabricated-media',
    killed: [media('unsplash', 'unsplash'), media('other-stock', 'other-stock'), media('pravatar', 'pravatar')],
    benign: [media('placeholder', 'placeholder')],
  },
  {
    label: 'navigation · target-resolves',
    archetype: navigationIntegrity,
    criterionId: 'target-resolves',
    killed: [nav('dead-route', '/missing'), nav('ghost-route', '/ghost')],
    benign: [nav('registered', '/home')],
  },
  {
    label: 'mount-stability · settles-without-storm',
    archetype: mountStability,
    criterionId: 'settles-without-storm',
    killed: [storm('storm', 'storm')],
    benign: [storm('calm', 'calm')],
  },
  {
    label: 'persona · no-cross-persona-affordance',
    archetype: personaVisibility,
    criterionId: 'no-cross-persona-affordance',
    killed: [persona('as-button', 'button'), persona('as-link', 'link'), persona('as-tab', 'tab')],
    benign: [persona('scoped', 'none')],
  },
];

async function fails(set: MutationSet, m: Mut): Promise<boolean> {
  const v = await verify(set.archetype, m.subject);
  return v.results.find((r) => r.criterionId === set.criterionId)?.status === 'fail';
}

describe('AVP — mutation testing (criterion robustness)', () => {
  for (const set of sets) {
    it(`${set.label}: kills every mutant + no false alarm`, async () => {
      const survivors: string[] = [];
      for (const m of set.killed) if (!(await fails(set, m))) survivors.push(m.label);
      const falseAlarms: string[] = [];
      for (const b of set.benign) if (await fails(set, b)) falseAlarms.push(b.label);
      // eslint-disable-next-line no-console
      console.log(
        `\n[AVP mutation] ${set.label}: killed=${set.killed.length - survivors.length}/${set.killed.length}` +
          (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
          (falseAlarms.length ? `  FALSE-ALARMS=[${falseAlarms.join(', ')}]` : '') +
          '\n',
      );
      expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
      expect(falseAlarms, `false alarms: ${falseAlarms.join(', ')}`).toHaveLength(0);
    });
  }

  it('emits the overall mutation score', async () => {
    let killed = 0;
    let total = 0;
    for (const set of sets) {
      for (const m of set.killed) {
        total++;
        if (await fails(set, m)) killed++;
      }
    }
    // eslint-disable-next-line no-console
    console.log(`\n[AVP] mutation score = ${killed}/${total} mutants killed\n`);
    expect(killed).toBe(total);
  });
});
