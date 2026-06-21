import { describe, it, expect } from 'vitest';
import { verifyDesign } from '../src/adapter-design/verify';
import { themeParity } from '../src/archetypes/theme-parity';
import type { ReactDesignSubject } from '../src/adapter-design/subject';
import { buildThemeBadge, type ThemeVariant } from './dataset/theme-badge';

/**
 * AVP Design — theme-parity · flips-with-theme. The second design criterion: across
 * every theme, every colour the surface renders belongs to the ACTIVE theme's scale.
 * The canonical escape is a light value stranded in dark mode (a light badge on a dark
 * surface). Faithful: "raw palette steps had no dark pair" (dd834c98), "theme toggle
 * stuck on dark" (67ac3fcd). Deterministic in jsdom: render under light + dark, check
 * colours against each theme's token set.
 */
const subject = (variant: ThemeVariant): ReactDesignSubject => ({
  name: `theme-${variant}`,
  renderTheme: buildThemeBadge(variant),
});

const themeStatus = async (variant: ThemeVariant) => {
  const v = await verifyDesign(themeParity, subject(variant));
  return v.results.find((r) => r.criterionId === 'flips-with-theme');
};

describe('AVP Design — verifier accuracy (theme-parity · flips-with-theme)', () => {
  it('fails the BAD surface on "flips-with-theme" (light value stranded in dark — escape dd834c98)', async () => {
    const target = await themeStatus('hardcoded-light');
    expect(target, 'criterion missing').toBeDefined();
    expect(target?.status, target?.reason).toBe('fail');
  });

  it('passes the GOOD surface with no false alarm (colours resolve per theme)', async () => {
    const v = await verifyDesign(themeParity, subject('good'));
    const fails = v.results.filter((r) => r.status === 'fail');
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
    expect(v.acceptanceScore).toBe(1);
  });

  it('emits the theme-parity number', async () => {
    const detected = (await themeStatus('hardcoded-light'))?.status === 'fail' ? 1 : 0;
    const falseAlarms = (await themeStatus('good'))?.status === 'fail' ? 1 : 0;
    // eslint-disable-next-line no-console
    console.log(`\n[AVP Design] theme-parity flips-with-theme detection=${detected}/1  false-alarm=${falseAlarms}\n`);
    expect(detected).toBe(1);
    expect(falseAlarms).toBe(0);
  });
});

/**
 * Mutation family for flips-with-theme — distinct ways a surface fails to flip: a
 * stuck light background, stuck light text (invisible in dark), every colour pinned to
 * light, and a raw palette step with no pair in either theme. A robust criterion kills
 * every one while leaving the theme-aware GOOD surface green.
 */
const MUTANTS: readonly ThemeVariant[] = ['stuck-bg', 'stuck-text', 'hardcoded-light', 'raw-step'];

describe('AVP Design — mutation testing (theme-parity · flips-with-theme)', () => {
  it('kills every non-flipping mutant + no false alarm', async () => {
    const survivors: string[] = [];
    for (const m of MUTANTS) if ((await themeStatus(m))?.status !== 'fail') survivors.push(m);
    const falseAlarm = (await themeStatus('good'))?.status === 'fail';
    // eslint-disable-next-line no-console
    console.log(
      `\n[AVP Design mutation] theme-parity · flips-with-theme: killed=${MUTANTS.length - survivors.length}/${MUTANTS.length}` +
        (survivors.length ? `  SURVIVORS=[${survivors.join(', ')}]` : '') +
        (falseAlarm ? '  FALSE-ALARM=[good]' : '') +
        '\n',
    );
    expect(survivors, `surviving mutants (criterion hole): ${survivors.join(', ')}`).toHaveLength(0);
    expect(falseAlarm, 'false alarm on the theme-aware surface').toBe(false);
  });
});
