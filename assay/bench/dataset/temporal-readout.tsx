/**
 * Faithful reproduction of the temporal-integrity escape (`zoned-to-user`): a stored
 * UTC instant must be shown in the VIEWER's timezone, not UTC/server/ambient. Mined
 * from documenso ("default to user timezone" 22fd1b5b) and cal.com ("Stores the
 * DateRange in UTC instead of user machine" c1d0a6bb; "event startTime is in utc"
 * d70fa462).
 *
 * The instant `2025-01-01T02:00:00Z` falls on different calendar DAYS by zone:
 *   - America/Sao_Paulo (UTC-3, no DST): 2024-12-31 23:00  → "2024-12-31"  ← the user's real day
 *   - UTC / London(+0) / Tokyo(+9):       2025-01-01 …      → "2025-01-01"  ← a day AHEAD
 * So every wrong-zone rendering deterministically reads the day after the user's, on
 * any CI host (explicit `Intl` timeZone / UTC ISO are host-independent).
 *
 * Variants:
 *   good         : formatted in the user's zone (America/Sao_Paulo) → 2024-12-31
 *   utc          : formatted in UTC                                  → 2025-01-01
 *   iso-slice    : `new Date(iso).toISOString().slice(0,10)` (the lazy bug) → 2025-01-01
 *   tokyo        : formatted in a far-east server zone (Asia/Tokyo)  → 2025-01-01
 *   server-london: formatted in a fixed server zone (Europe/London) → 2025-01-01
 *   raw-iso      : dumps the raw UTC ISO string                      → 2025-01-01…
 */
export type TemporalVariant = 'good' | 'utc' | 'iso-slice' | 'tokyo' | 'server-london' | 'raw-iso';

export const INSTANT_ISO = '2025-01-01T02:00:00Z';
export const USER_ZONE = 'America/Sao_Paulo';

const isoDate = (instant: string, timeZone: string): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(instant));

function shown(variant: TemporalVariant): string {
  switch (variant) {
    case 'good':
      return isoDate(INSTANT_ISO, USER_ZONE);
    case 'utc':
      return isoDate(INSTANT_ISO, 'UTC');
    case 'iso-slice':
      return new Date(INSTANT_ISO).toISOString().slice(0, 10);
    case 'tokyo':
      return isoDate(INSTANT_ISO, 'Asia/Tokyo');
    case 'server-london':
      return isoDate(INSTANT_ISO, 'Europe/London');
    case 'raw-iso':
      return new Date(INSTANT_ISO).toISOString();
  }
}

function Screen({ variant }: { variant: TemporalVariant }) {
  return (
    <div>
      <h1>Document expiry</h1>
      <p>Expires: {shown(variant)}</p>
    </div>
  );
}

export const buildTemporalScreen = (variant: TemporalVariant) => () => <Screen variant={variant} />;
