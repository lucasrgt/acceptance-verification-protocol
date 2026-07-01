import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { navigationIntegrity } from '../src/archetypes/navigation-integrity';
import type { RouterNavSubject } from '../src/adapter-react/navigation-router';
import { GoodBack, BadBack } from './dataset/back-nav';

/**
 * navigation-integrity, back-has-fallback (router-mounted). Opened deep with no
 * history, Back must land on a real fallback, not be a dead no-op.
 */
const deepBack = (router: () => ReturnType<typeof GoodBack>): RouterNavSubject => ({
  name: 'deep-back',
  router,
  back: { trigger: { role: 'button', name: /voltar/i }, fallbackMarker: /home dashboard/i },
});

describe('AVP — verifier accuracy (navigation-integrity, back-has-fallback)', () => {
  it('fails the BAD deep-back on "back-has-fallback" (escape 3aa1c80a)', async () => {
    const v = await verify(navigationIntegrity, deepBack(BadBack));
    const target = v.results.find((r) => r.criterionId === 'back-has-fallback');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD deep-back with no false alarm', async () => {
    const v = await verify(navigationIntegrity, deepBack(GoodBack));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the back-has-fallback number', async () => {
    const bad = await verify(navigationIntegrity, deepBack(BadBack));
    const good = await verify(navigationIntegrity, deepBack(GoodBack));
    const detected = bad.results.find((r) => r.criterionId === 'back-has-fallback')?.status === 'fail' ? 1 : 0;
    const falseAlarms = good.results.some((r) => r.status === 'fail') ? 1 : 0;
     
    console.log(`\n[AVP] navigation back-has-fallback detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});
