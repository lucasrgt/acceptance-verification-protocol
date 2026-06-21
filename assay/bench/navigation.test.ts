import type { ReactElement } from 'react';
import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { navigationIntegrity } from '../src/archetypes/navigation-integrity';
import type { NavigationSubject } from '../src/adapter-react/navigation-integrity';
import { GoodInbox, BadInbox, UsersLink } from './dataset/nav-screens';

/**
 * navigation-integrity benchmark — cross-project. The largest escape class,
 * caught the same way in two stacks: a wrong target (marketplace) and an orphaned
 * route (SaaS).
 */
const inbox = (render: (n: (p: string) => void) => ReactElement): NavigationSubject => ({
  name: 'chat-inbox',
  render,
  affordances: [{ role: 'button', name: /profile/i }],
  registeredRoutes: ['/host/settings', '/messaging', '/host/payments'],
});

// Same link component; only the route table differs (the route was orphaned).
const usersLink = (registeredRoutes: readonly string[]): NavigationSubject => ({
  name: 'settings-users-link',
  render: UsersLink,
  affordances: [{ role: 'button', name: /users/i }],
  registeredRoutes,
});

const cases = [
  {
    label: 'wrong target (marketplace)',
    source: '287ab352',
    good: inbox(GoodInbox),
    bad: inbox(BadInbox),
  },
  {
    label: 'orphaned route (SaaS)',
    source: 'projp:7ba900d',
    good: usersLink(['/settings', '/settings/users', '/settings/users/:id']),
    bad: usersLink(['/settings', '/settings/profile']),
  },
];

describe('AVP — verifier accuracy (navigation-integrity, cross-project)', () => {
  for (const c of cases) {
    it(`fails the BAD ${c.label} on "target-resolves" (escape ${c.source})`, async () => {
      const v = await verify(navigationIntegrity, c.bad);
      const target = v.results.find((r) => r.criterionId === 'target-resolves');
      expect(target, 'criterion missing').toBeDefined();
      expect(target?.status, target?.reason).toBe('fail');
    });

    it(`passes the GOOD ${c.label} with no false alarm`, async () => {
      const v = await verify(navigationIntegrity, c.good);
      const fails = v.results.filter((r) => r.status === 'fail');
      expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
      expect(v.acceptanceScore).toBe(1);
    });
  }

  it('emits the navigation-integrity number', async () => {
    let detected = 0;
    let falseAlarms = 0;
    for (const c of cases) {
      const bad = await verify(navigationIntegrity, c.bad);
      const good = await verify(navigationIntegrity, c.good);
      if (bad.results.find((r) => r.criterionId === 'target-resolves')?.status === 'fail') detected++;
      if (good.results.some((r) => r.status === 'fail')) falseAlarms++;
    }
    // eslint-disable-next-line no-console
    console.log(`\n[AVP] navigation-integrity (cross-project) detection=${detected}/${cases.length}  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(cases.length);
    expect(falseAlarms).toBe(0);
  });
});
