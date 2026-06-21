import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `temporal-integrity` criteria speak; the adapter implements it. */
export interface TemporalExpect {
  /** A displayed instant is rendered in the user's timezone — not UTC, the server's zone, or the host's ambient zone (no day-boundary off-by-one). */
  zonedToUser(): void;
  /** A date-only value (no time, no zone) is displayed as authored — never zone-shifted by a round-trip through `new Date()` / `dayjs.tz()`. */
  floatingDateNotShifted(): void;
}

/**
 * The `temporal-integrity` archetype — "time is correct: an instant is shown in the
 * user's own timezone". A frontend archetype, DOM-observable. The canonical
 * LLM/test escape: a stored UTC instant is formatted in UTC (or the server's zone,
 * or via the lazy `new Date(iso).toISOString().slice(0,10)`) instead of the
 * viewer's IANA zone, so a value near a day boundary renders a day off — the test
 * ran at a fixed instant in a fixed zone and never saw it. Mined as a genuinely NEW
 * escape class (NOT in the marketplace corpus) from two fresh domains: e-signature
 * (documenso "default to user timezone" 22fd1b5b) and scheduling — cal.com, where
 * timezone is the product itself: 189 timezone-shaped fix commits, e.g. "Stores the
 * DateRange in UTC instead of user machine that caused the bug" (c1d0a6bb) and
 * "event startTime is in utc" (d70fa462). See docs/corpus-multistack.md.
 *
 * Two criteria are executed (the two are sharp opposites — the #1 source of date
 * confusion in JS): `zoned-to-user` says an INSTANT must take the viewer's zone;
 * `floating-date-not-shifted` says a DATE-ONLY value must take NO zone. Conflating
 * them is the bug. Frontier (catalogued, not yet executed): `clock-not-frozen` (a
 * relative-time / countdown reflects the live clock, not a value frozen at module
 * load).
 */
export const temporalIntegrity = archetype('temporal-integrity', '0.1.0', () => {
  criterion(
    'zoned-to-user',
    'A displayed instant is rendered in the user\'s timezone: a stored UTC timestamp near a day boundary shows the user\'s local calendar date, not the UTC/server/ambient date — no off-by-one day.',
    { under: 'success', scope: 'invariant', requires: 'instant', seenIn: ['documenso:22fd1b5b', 'calcom:c1d0a6bb', 'calcom:d70fa462'] },
    mechanical<TemporalExpect>(async ({ act, expect }) => {
      await act();
      expect.zonedToUser();
    }),
  );

  criterion(
    'floating-date-not-shifted',
    'A date-only value (an expiry date, a birthday — no time, no zone) is displayed as authored: it is never zone-shifted a day by a round-trip through `new Date()` / `dayjs.tz()`. A floating date has no timezone; render its calendar parts, don\'t localize it.',
    { under: 'success', scope: 'invariant', requires: 'floating-date', seenIn: ['calcom:26e85823', 'calcom:f7b2f276', 'documenso:22fd1b5b'] },
    mechanical<TemporalExpect>(async ({ act, expect }) => {
      await act();
      expect.floatingDateNotShifted();
    }),
  );
});
