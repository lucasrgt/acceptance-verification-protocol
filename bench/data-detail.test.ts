import type { ReactElement } from 'react';
import { describe, it, expect } from 'vitest';
import { verify } from '../src/adapter-react/verify';
import { dataHonesty } from '../src/archetypes/data-honesty';
import type { DetailHonestySubject } from '../src/adapter-react/data-detail';
import { GoodJob, BadJob } from './dataset/detail-view';

/**
 * data-honesty, flash-of-id (timing-based). A detail view must render resolved
 * data or a skeleton — never a raw id flashed before the name resolves.
 */
const API = 'http://localhost/api';

const job = (render: () => ReactElement, withName: boolean): DetailHonestySubject => ({
  name: 'job-detail',
  render,
  entityEndpoint: { method: 'GET', path: `${API}/jobs/1` },
  entityResponse: withName
    ? { id: 'job-1', customerId: 'cust-9f3a', customerName: 'Acme Corp' }
    : { id: 'job-1', customerId: 'cust-9f3a' },
  nameEndpoint: { method: 'GET', path: `${API}/customers/cust-9f3a` },
  nameResponse: { name: 'Acme Corp' },
  rawId: 'cust-9f3a',
});

describe('AVP — verifier accuracy (data-honesty, flash-of-id)', () => {
  it('fails the BAD job detail on "no-raw-id-flash" (escape projp:ce04d0f)', async () => {
    const v = await verify(dataHonesty, job(BadJob, false));
    const target = v.results.find((r) => r.criterionId === 'no-raw-id-flash');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD job detail with no false alarm', async () => {
    const v = await verify(dataHonesty, job(GoodJob, true));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the flash-of-id number', async () => {
    const bad = await verify(dataHonesty, job(BadJob, false));
    const good = await verify(dataHonesty, job(GoodJob, true));
    const detected = bad.results.find((r) => r.criterionId === 'no-raw-id-flash')?.status === 'fail' ? 1 : 0;
    const falseAlarms = good.results.some((r) => r.status === 'fail') ? 1 : 0;
    // eslint-disable-next-line no-console
    console.log(`\n[AVP] data-honesty flash-of-id detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});
