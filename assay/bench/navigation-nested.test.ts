import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { navigationIntegrity } from '../src/archetypes/navigation-integrity';
import type { RouterNavSubject } from '../src/adapter-react/navigation-router';
import { GoodNested, BadNested } from './dataset/nested-route';

/**
 * navigation-integrity, router-mounted: the failure `target-resolves` can't see —
 * the route resolves, but the parent layout's missing <Outlet/> renders a blank
 * screen. Uses a real TanStack router (the substrate the web apps run).
 */
const nested = (router: () => ReturnType<typeof GoodNested>): RouterNavSubject => ({
  name: 'customer-edit-nested',
  router,
  childMarker: /edit customer form/i,
});

describe('AVP — verifier accuracy (navigation-integrity, nested/router-mounted)', () => {
  it('fails the BAD nested route on "nested-renders" (escape projp:37af286)', async () => {
    const v = await verify(navigationIntegrity, nested(BadNested));
    const target = v.results.find((r) => r.criterionId === 'nested-renders');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD nested route with no false alarm', async () => {
    const v = await verify(navigationIntegrity, nested(GoodNested));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the nested-renders number', async () => {
    const bad = await verify(navigationIntegrity, nested(BadNested));
    const good = await verify(navigationIntegrity, nested(GoodNested));
    const detected = bad.results.find((r) => r.criterionId === 'nested-renders')?.status === 'fail' ? 1 : 0;
    const falseAlarms = good.results.some((r) => r.status === 'fail') ? 1 : 0;
    // eslint-disable-next-line no-console
    console.log(`\n[AVP] navigation nested-renders detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});
