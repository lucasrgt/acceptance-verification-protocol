import { cleanup, render } from '@testing-library/react';
import { act } from 'react';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { InputPurposeExpect } from '../archetypes/input-purpose';
import type { ReactDesignSubject } from './subject';

const settle = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

/**
 * The expected autocomplete purpose of an input, inferred ONLY when it is unambiguous —
 * else null (no opinion). Type wins; otherwise a high-confidence name/id pattern. Kept
 * deliberately conservative so a non-personal field (search, opaque text) is never flagged.
 */
function expectedPurpose(el: HTMLInputElement): string | null {
  const type = (el.getAttribute('type') ?? 'text').toLowerCase();
  if (type === 'email') return 'email';
  if (type === 'tel') return 'tel';
  if (type === 'password') return 'password';
  // search/checkbox/radio/button/submit/hidden/range/color/file — never personal data.
  if (type !== 'text' && type !== 'search' && type !== '') return null;
  if (type === 'search') return null;

  const key = `${el.getAttribute('name') ?? ''} ${el.id ?? ''}`.toLowerCase();
  const PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
    [/\b(e[-_]?mail)\b/, 'email'],
    [/\b(phone|tel|telephone|mobile)\b/, 'tel'],
    [/\b(first[-_]?name|given[-_]?name|fname)\b/, 'given-name'],
    [/\b(last[-_]?name|family[-_]?name|lname|surname)\b/, 'family-name'],
    [/\b(street|address[-_]?line|address1)\b/, 'street-address'],
    [/\b(zip|postal|postcode)\b/, 'postal-code'],
    [/\b(organi[sz]ation|company)\b/, 'organization'],
    [/\b(cc[-_]?number|card[-_]?number)\b/, 'cc-number'],
  ];
  for (const [re, token] of PATTERNS) if (re.test(key)) return token;
  return null;
}

function describe(el: HTMLInputElement): string {
  const type = el.getAttribute('type') ?? 'text';
  const name = el.getAttribute('name') ?? el.id;
  return name ? `input[type=${type}] name=${JSON.stringify(name)}` : `input[type=${type}]`;
}

/** The design adapter's `input-purpose` probe — every unambiguous personal field declares autocomplete. */
export function inputPurposeProbe(subject: ReactDesignSubject): Probe<InputPurposeExpect> {
  let missing: HTMLInputElement[] = [];
  let scoped = 0;
  let acted = false;
  return {
    async act() {
      if (!subject.render) throw new AvpFail('input-purpose needs a render() seam.');
      cleanup();
      render(subject.render());
      await settle();
      const inputs = Array.from(document.body.querySelectorAll<HTMLInputElement>('input'));
      const personal = inputs.filter((el) => expectedPurpose(el) !== null);
      scoped = personal.length;
      // The escape: a personal-data field with NO autocomplete attribute at all.
      missing = personal.filter((el) => el.getAttribute('autocomplete') === null);
      acted = true;
    },
    expect: {
      personalFieldsDeclarePurpose() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (missing.length) {
          const first = missing[0];
          throw new AvpFail(
            `${missing.length} of ${scoped} personal-data field(s) declare no autocomplete purpose — first: <${describe(
              first,
            )}> (expected autocomplete="${expectedPurpose(first)}"). The field offers no autofill and no programmatic purpose (WCAG 1.3.5). Add an autocomplete token (or autocomplete="off" to opt out deliberately).`,
            { missing: missing.map(describe), scoped },
          );
        }
      },
    },
  };
}

/** The design adapter's hooks for `input-purpose`. */
export function inputPurposeHooks(subject: ReactDesignSubject): VerifyHooks {
  return { probe: () => inputPurposeProbe(subject) };
}
