/**
 * Faithful reproduction of the floating-date escape (`floating-date-not-shifted`): a
 * date-only value — a calendar date with no time and no zone (an expiry date, a
 * birthday) — must display as authored, never zone-shifted by a round-trip through
 * `new Date()` / `dayjs.tz()`. Mined from cal.com: "use UTC parsing for recurring
 * booking dates to prevent timezone conversion issues" (26e85823 — the fix replaces
 * `dayjs.tz(dateStr, tz)` with `dayjs.utc(dateStr)`) and "correctly parse ISO
 * timezone offsets" (f7b2f276).
 *
 * `2025-01-01` parsed as `new Date('2025-01-01')` is midnight UTC; localized to ANY
 * zone behind UTC it drops to 2024-12-31 — deterministic on any CI host (explicit
 * western `Intl` timeZone / explicit offset subtraction, never the host's zone).
 *
 * Variants:
 *   good        : the calendar parts shown as authored (no Date round-trip) → 2025-01-01
 *   dayjs-tz    : Intl in America/Sao_Paulo (the `dayjs.tz(dateStr, tz)` bug)   → 2024-12-31
 *   tolocale    : `new Date(d).toLocaleDateString` in America/New_York          → 2024-12-31
 *   honolulu    : Intl in Pacific/Honolulu (a far-western zone)                 → 2024-12-31
 *   offset-sub  : manual `getTime() - 5h` then ISO slice                        → 2024-12-31
 */
export type FloatingVariant = 'good' | 'dayjs-tz' | 'tolocale' | 'honolulu' | 'offset-sub';

export const DATE_ONLY = '2025-01-01';

function shown(variant: FloatingVariant): string {
  const asInstant = new Date(DATE_ONLY); // midnight UTC — the round-trip that strands a date-only value
  switch (variant) {
    case 'good':
      return DATE_ONLY; // authored calendar parts, untouched by any zone
    case 'dayjs-tz':
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(asInstant);
    case 'tolocale':
      return asInstant.toLocaleDateString('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
    case 'honolulu':
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Honolulu', year: 'numeric', month: '2-digit', day: '2-digit' }).format(asInstant);
    case 'offset-sub':
      return new Date(asInstant.getTime() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }
}

function Screen({ variant }: { variant: FloatingVariant }) {
  return (
    <div>
      <h1>Plan expiry date</h1>
      <p>Valid through: {shown(variant)}</p>
    </div>
  );
}

export const buildFloatingScreen = (variant: FloatingVariant) => () => <Screen variant={variant} />;
