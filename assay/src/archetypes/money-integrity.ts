import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `money-integrity` criteria speak; the adapter implements it. */
export interface MoneyExpect {
  /** A money split sums to the whole, to the cent, over a range of totals — and respects the policy fraction. */
  splitInvariant(): void;
  /** A money amount is displayed at the currency's exact precision — no float artifact, no dropped/extra decimals, no wrong rounding. */
  amountRenderedExact(): void;
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
 * (docs/corpus-multistack.md). Now executed across BOTH substrates: the split at
 * rest over HTTP, and the amount in DISPLAY over React (`amount-rendered-exact`) —
 * the second escape mined from firefly-iii, a finance app where money-integrity is
 * the dominant class (89 fixes), e.g. "Foreign Amount rounded on some pages"
 * (797064a1), "reconciliation displayed amount" (d55cc03e), "Fix amount display"
 * (ebc7ea0e). One archetype, two layers — money correct at rest AND in the view.
 */
export const moneyIntegrity = archetype('money-integrity', '0.1.0', () => {
  criterion(
    'split-invariant',
    'A money split sums to the whole, exact to the cent: over every total, platform + host === total, each share is non-negative, and the platform share matches the policy fraction to the cent — no float-rounding leak.',
    { under: 'success', scope: 'invariant', requires: 'split', seenIn: ['bitwarden:2e0e10307', 'bitwarden:6d69c9bb9'] },
    mechanical<MoneyExpect>(async ({ act, expect }) => {
      await act();
      expect.splitInvariant();
    }),
  );

  criterion(
    'amount-rendered-exact',
    'A money amount is displayed at the currency\'s exact precision: the rendered string equals the value formatted to its minor units — no float artifact (0.30000000000000004), no dropped or extra decimals (10.5 / 10.5000 for 10.50), no wrong rounding. Format from integer minor units, never raw float arithmetic.',
    { under: 'success', scope: 'invariant', requires: 'amount-display', seenIn: ['firefly:797064a1', 'firefly:d55cc03e', 'firefly:ebc7ea0e'] },
    mechanical<MoneyExpect>(async ({ act, expect }) => {
      await act();
      expect.amountRenderedExact();
    }),
  );
});
