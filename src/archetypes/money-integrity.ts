import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `money-integrity` criteria speak; the adapter implements it. */
export interface MoneyExpect {
  /** A money split sums to the whole, to the cent, over a range of totals — and respects the policy fraction. */
  splitInvariant(): void;
}

/**
 * The `money-integrity` archetype — "money is correct at rest and in transit". A
 * backend archetype, HTTP-observable: the split of a charge into platform fee and
 * payout must **sum back to the whole, exact to the cent**, for every total. The
 * recurring escape is computing each share independently with float-percentage math
 * (`round(total*0.15)` + `round(total*0.85)`), which drifts a cent on many totals.
 *
 * Mined as the marketplace's 15/85 platform/host split (catalogued in
 * docs/catalog.md #9). The money class is confirmed cross-stack in .NET by
 * bitwarden's currency-culture invariant fixes (2e0e10307, 6d69c9bb9) — money
 * mis-valued in transit. money-integrity appears in 4/6 corpus repos
 * (docs/corpus-multistack.md). This is the FIRST executed money criterion; it opens
 * the archetype on the ledger and proves the HTTP adapter reaches money math at rest.
 */
export const moneyIntegrity = archetype('money-integrity', '0.1.0', () => {
  criterion(
    'split-invariant',
    'A money split sums to the whole, exact to the cent: over every total, platform + host === total, each share is non-negative, and the platform share matches the policy fraction to the cent — no float-rounding leak.',
    { under: 'success', scope: 'invariant', seenIn: ['bitwarden:2e0e10307', 'bitwarden:6d69c9bb9'] },
    mechanical<MoneyExpect>(async ({ act, expect }) => {
      await act();
      expect.splitInvariant();
    }),
  );
});
