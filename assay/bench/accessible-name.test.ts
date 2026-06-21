import { describe, it, expect } from 'vitest';
import { verifyDesign } from '../src/adapter-design/verify';
import { accessibleName } from '../src/archetypes/accessible-name';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildLabeledControls, type LabeledControlsVariant } from './dataset/labeled-controls';

/**
 * AVP Design — accessible-name · controls-have-accessible-name. The first design
 * criterion on the `dom` substrate (the accessibility tree — no computed style, no
 * layout): every interactive control must resolve a non-empty accessible name. The
 * single most common real-world a11y escape, mechanical and faithfully grounded in
 * cal.com's aria-label fixes (8cace7f7, a0e4580f, bf9be591, 02a86f1d). Deterministic
 * in jsdom: render, walk the controls, resolve each name from the a11y tree.
 */
const subject = (variant: LabeledControlsVariant): ReactDesignSubject => ({
  name: `a11y-name-${variant}`,
  render: buildLabeledControls(variant),
});

const nameStatus = async (variant: LabeledControlsVariant) => {
  const v = await verifyDesign(accessibleName, subject(variant));
  return v.results.find((r) => r.criterionId === 'controls-have-accessible-name');
};

describe('AVP Design — verifier accuracy (accessible-name · controls-have-accessible-name)', () => {
  it('fails the BAD toolbar on "controls-have-accessible-name" (icon close button with no label — escape 8cace7f7)', async () => {
    const target = await nameStatus('icon-button-bare');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD toolbar with no false alarm (every control named)', async () => {
    const v = await verifyDesign(accessibleName, subject('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the accessible-name number', async () => {
    const detected = (await nameStatus('icon-button-bare'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await nameStatus('good'))?.status === 'fail' ? 1 : 0;
    // eslint-disable-next-line no-console
    console.log(`\n[AVP Design] accessible-name controls-have-accessible-name detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for controls-have-accessible-name — distinct ways a control loses its
 * accessible name: a bare icon button (label stripped, only an aria-hidden glyph), an
 * input with only a placeholder (no <label>), an icon-only link, and a button whose
 * text is hidden from the a11y tree (visible but unannounced). A robust criterion kills
 * every one while leaving the fully-labelled GOOD toolbar green.
 */
const MUTANTS: readonly LabeledControlsVariant[] = ['icon-button-bare', 'input-no-label', 'link-icon-only', 'label-in-hidden'];

describe('AVP Design — mutation testing (accessible-name · controls-have-accessible-name)', () => {
  it('kills every unnamed-control mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await nameStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await nameStatus('good'))?.status === 'fail';
    // eslint-disable-next-line no-console
    console.log(
      `\n[AVP Design mutation] accessible-name · controls-have-accessible-name: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the fully-labelled toolbar').toBe(false);
  });
});
