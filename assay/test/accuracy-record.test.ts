import { describe, expect, it } from 'vitest';
import { parseAccuracyMessage } from '../bench/accuracy-record';

describe('accuracy record protocol', () => {
  it('parses behavior and design calibration lines without counting mutation summaries', () => {
    expect(parseAccuracyMessage('[AVP] action-effect detection=3/3  false-alarm=0/3')).toEqual({
      label: 'action-effect',
      detection: 3,
      total: 3,
      falseAlarms: 0,
    });
    expect(parseAccuracyMessage('[AVP Design] layout detection=1/1  false-alarm=0')).toEqual({
      label: 'layout',
      detection: 1,
      total: 1,
      falseAlarms: 0,
    });
    expect(parseAccuracyMessage('[AVP mutation] layout: killed=3/3')).toBeNull();
  });
});
