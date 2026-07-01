import type { ReactElement } from 'react';
import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { mountStability } from '../src/archetypes/mount-stability';
import type { MountStabilitySubject } from '../src/adapter-react/mount-stability';
import { GoodBoot, BadBoot } from './dataset/boot-screen';

/**
 * mount-stability benchmark. The escape (an anonymous /me refetch storm freezing
 * the boot splash) was near-identical in two independent projects — one repro
 * stands for both (e6c81abe, projp:626c8ce).
 */
const API = 'http://localhost/api';

const boot = (render: () => ReactElement): MountStabilitySubject => ({
  name: 'boot-splash',
  render,
  endpoint: { method: 'GET', path: `${API}/me` },
  respondStatus: 401, // anonymous cold boot
  maxRequests: 3,
});

describe('AVP — verifier accuracy (mount-stability)', () => {
  it('fails the BAD boot on "settles-without-storm" (escapes e6c81abe / projp:626c8ce)', async () => {
    const v = await verify(mountStability, boot(BadBoot));
    const target = v.results.find((r) => r.criterionId === 'settles-without-storm');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD boot with no false alarm', async () => {
    const v = await verify(mountStability, boot(GoodBoot));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the mount-stability number', async () => {
    const bad = await verify(mountStability, boot(BadBoot));
    const good = await verify(mountStability, boot(GoodBoot));
    const detected = bad.results.find((r) => r.criterionId === 'settles-without-storm')?.status === 'fail' ? 1 : 0;
    const falseAlarms = good.results.some((r) => r.status === 'fail') ? 1 : 0;
     
    console.log(`\n[AVP] mount-stability detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});
