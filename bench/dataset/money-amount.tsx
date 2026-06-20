/**
 * Faithful reproduction of the money-display escape (`amount-rendered-exact`): a money
 * amount must be shown at the currency's exact precision. Mined from firefly-iii, a
 * finance app where money-integrity is the dominant class (89 fixes): "Foreign Amount
 * rounded on some pages" (797064a1), "reconciliation displayed amount" (d55cc03e),
 * "Fix amount display" (ebc7ea0e).
 *
 * The exact value is 1050 minor units = 10.50. Every BAD variant renders it through
 * raw float arithmetic and gets the string wrong in a distinct way.
 *
 * Variants:
 *   good          : format from integer minor units                 → 10.50
 *   no-fixed      : String(minor/100) drops the trailing zero        → 10.5
 *   drops-cents   : Math.floor(minor/100) drops the minor units      → 10
 *   over-precision: toFixed(4) shows phantom precision               → 10.5000
 *   wrong-round   : Math.round(minor/100) rounds the cents away      → 11
 */
export type MoneyVariant = 'good' | 'no-fixed' | 'drops-cents' | 'over-precision' | 'wrong-round';

export const AMOUNT_MINOR = 1050;

function shown(variant: MoneyVariant): string {
  const minor = AMOUNT_MINOR;
  switch (variant) {
    case 'good': {
      const whole = Math.floor(minor / 100);
      const frac = String(minor % 100).padStart(2, '0');
      return `${whole}.${frac}`;
    }
    case 'no-fixed':
      return String(minor / 100);
    case 'drops-cents':
      return String(Math.floor(minor / 100));
    case 'over-precision':
      return (minor / 100).toFixed(4);
    case 'wrong-round':
      return String(Math.round(minor / 100));
  }
}

function Amount({ variant }: { variant: MoneyVariant }) {
  return (
    <div>
      <span>Balance</span>
      <p data-testid="amount">$ {shown(variant)}</p>
    </div>
  );
}

export const buildAmount = (variant: MoneyVariant) => () => <Amount variant={variant} />;
