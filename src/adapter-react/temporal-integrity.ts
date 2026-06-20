import type { ReactElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { act } from 'react';
import { AvpFail, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { TemporalExpect } from '../archetypes/temporal-integrity';

/**
 * Descriptor of a React `temporal-integrity` subject. Mounts a screen that displays
 * a stored UTC instant; the displayed calendar date must be the one the user sees
 * in THEIR timezone, not the UTC/server zone.
 *
 * The subject carries the acceptance truth as data — the stored `instantIso` and the
 * viewer's IANA `timeZone` — so the probe computes the correct local date itself
 * (deterministically, via explicit `Intl` with an explicit `timeZone`, which is
 * host-independent) and never trusts the rendering to tell it what's right.
 */
export interface ReactTemporalSubject {
  readonly name: string;
  /** Mounts the screen that displays the date/time readout. */
  readonly render: () => ReactElement;
  /** Instant seam (zoned-to-user): the stored instant (UTC ISO 8601) the readout represents. */
  readonly instantIso?: string;
  /** Instant seam (zoned-to-user): the viewer's IANA timezone the readout must honor (e.g. `America/Sao_Paulo`). */
  readonly timeZone?: string;
  /** Floating-date seam (floating-date-not-shifted): a calendar date (`YYYY-MM-DD`) with no time and no zone, displayed as authored. */
  readonly dateOnly?: string;
}

/** The calendar date (`YYYY-MM-DD`) of an instant in a given IANA zone — deterministic on any host. */
function localDate(instantIso: string, timeZone: string): string {
  // en-CA renders ISO `YYYY-MM-DD`; an explicit timeZone makes this independent of the host's TZ.
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(instantIso),
  );
}

/** The first ISO calendar date (`YYYY-MM-DD`) shown in the rendered text, if any. */
function shownDate(): string | null {
  const text = document.body.textContent ?? '';
  return text.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
}

/** The React adapter's `temporal-integrity` probe (DOM half — zoned-to-user). */
export function temporalProbe(subject: ReactTemporalSubject): Probe<TemporalExpect> {
  let acted = false;
  return {
    async act() {
      cleanup();
      render(subject.render());
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });
      acted = true;
    },
    expect: {
      zonedToUser() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (!subject.instantIso || !subject.timeZone) throw new AvpFail('zoned-to-user needs the instant seam (instantIso + timeZone).');
        const userDate = localDate(subject.instantIso, subject.timeZone);
        const utcDate = localDate(subject.instantIso, 'UTC');
        const shown = shownDate();
        if (!shown) {
          throw new AvpFail(
            `No ISO calendar date (YYYY-MM-DD) was found in the readout — render the date for the user's zone (${subject.timeZone}) so it can be verified.`,
            { instantIso: subject.instantIso, timeZone: subject.timeZone, expected: userDate },
          );
        }
        if (shown === userDate) return;
        if (shown === utcDate && utcDate !== userDate) {
          throw new AvpFail(
            `The instant ${subject.instantIso} is displayed as ${shown} (UTC) but the user in ${subject.timeZone} is on ${userDate} — a day-boundary off-by-one. Format the instant in the user's timezone, not UTC/server time.`,
            { shown, expected: userDate, utc: utcDate, timeZone: subject.timeZone },
          );
        }
        throw new AvpFail(
          `The instant ${subject.instantIso} is displayed as ${shown}, but in the user's zone (${subject.timeZone}) it is ${userDate}. The readout is not zoned to the user.`,
          { shown, expected: userDate, utc: utcDate, timeZone: subject.timeZone },
        );
      },
      floatingDateNotShifted() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (!subject.dateOnly) throw new AvpFail('floating-date-not-shifted needs the floating-date seam (dateOnly).');
        const shown = shownDate();
        if (!shown) {
          throw new AvpFail(
            `No ISO calendar date (YYYY-MM-DD) was found in the readout — render the floating date ${subject.dateOnly} as authored so it can be verified.`,
            { dateOnly: subject.dateOnly },
          );
        }
        if (shown === subject.dateOnly) return;
        throw new AvpFail(
          `The date-only value ${subject.dateOnly} is displayed as ${shown} — it was zone-shifted by a Date()/dayjs.tz() round-trip. A floating date has no timezone; render its calendar parts as authored, don't localize it.`,
          { shown, authored: subject.dateOnly },
        );
      },
    },
  };
}

/** The React adapter's hooks for `temporal-integrity` (DOM half — zoned-to-user + floating-date-not-shifted). */
export function temporalHooks(subject: ReactTemporalSubject): VerifyHooks {
  return {
    probe: () => temporalProbe(subject),
    applies: (c) => {
      if (c.requires === 'instant' && !subject.instantIso) return 'Subject declares no instant seam — criterion not applicable.';
      if (c.requires === 'floating-date' && !subject.dateOnly) return 'Subject declares no floating-date seam — criterion not applicable.';
      return null;
    },
  };
}
