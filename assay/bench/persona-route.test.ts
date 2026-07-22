import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { personaVisibility } from '../src/archetypes/persona-visibility';
import type { PersonaRouteSubject } from '../src/adapter-react/persona-router';
import { buildPersonaRouter, SIGNED_IN_ACTOR, type PersonaRouteVariant } from './dataset/persona-route';

/**
 * persona-scoped-visibility · no-cross-persona-route (router-mounted). Signed in as
 * a traveler, a deep link to a host-scoped route must redirect to the traveler's own
 * area — never render the host dashboard. Faithful escape (opposite-persona
 * dashboard on a deep link); confirmed cross-stack by documenso's team-scoped page
 * access and bitwarden's cross-context settings leak. Shares the archetype with
 * no-cross-persona-affordance, gated by subject shape.
 */
const crossRoute = (variant: PersonaRouteVariant): PersonaRouteSubject => ({
  name: `persona-route-${variant}`,
  actor: SIGNED_IN_ACTOR,
  router: buildPersonaRouter(variant),
  guardMarker: /Traveler home/i,
  foreignMarker: /Host (dashboard|listings)/i,
  foreignRoutes: ['/host/dashboard', '/host/list'],
});

const routeStatus = async (variant: PersonaRouteVariant) => {
  const v = await verify(personaVisibility, crossRoute(variant));
  return v.results.find((r) => r.criterionId === 'no-cross-persona-route');
};

describe('AVP — verifier accuracy (persona-scoped-visibility · no-cross-persona-route)', () => {
  it('fails the BAD router on "no-cross-persona-route" (host screen on a deep link — escape documenso:2ba0f48c)', async () => {
    const target = await routeStatus('no-guard');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD router with no false alarm (affordance criterion is not applicable by shape)', async () => {
    const v = await verify(personaVisibility, crossRoute('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
    expect(v.results.find((r) => r.criterionId === 'no-cross-persona-affordance')?.status).toBe('not-applicable');
  });

  it('emits the no-cross-persona-route number', async () => {
    const detected = (await routeStatus('no-guard'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await routeStatus('good'))?.status === 'fail' ? 1 : 0;
     
    console.log(`\n[AVP] persona no-cross-persona-route detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for no-cross-persona-route — distinct ways a foreign-actor route
 * leaks (no guard, a presence-not-persona check, a redirect to the wrong area, a
 * guard that lives on the splash not the route). A robust criterion kills every one
 * while leaving the guarded GOOD router green.
 */
const MUTANTS: readonly PersonaRouteVariant[] = ['no-guard', 'wrong-actor-check', 'redirect-wrong', 'splash-only', 'one-route-only'];

describe('AVP — mutation testing (persona-scoped-visibility · no-cross-persona-route)', () => {
  it('kills every cross-persona-route mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await routeStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await routeStatus('good'))?.status === 'fail';
     
    console.log(
      `\n[AVP mutation] persona-scoped-visibility · no-cross-persona-route: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the guarded router').toBe(false);
  });
});
