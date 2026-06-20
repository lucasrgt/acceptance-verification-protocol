import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `lifecycle-gate` criteria speak; the adapter implements it. */
export interface LifecycleGateExpect {
  /** A transition on a resource whose precondition is unmet was refused server-side (the FE gate is a courtesy). */
  gateEnforcedServerSide(): void;
  /** With a precondition unmet, the FE disables the action (and says why) — it doesn't offer a click that will fail. */
  blockedActionIsDisabled(): void;
}

/**
 * The `lifecycle-gate` archetype — "a transition is gated on its real
 * preconditions". A backend archetype, HTTP-observable: a state transition
 * (publish / go-live / sign / complete) that the FE merely disables but the server
 * does not enforce lets a direct request transition a not-ready resource. Mined as
 * the marketplace's go-live/publish gated only client-side (catalogued in
 * docs/catalog.md #4). Confirmed cross-stack in Node/TS by documenso's "prevent
 * signing draft documents" (6e09a470) and in .NET by bitwarden's prevent
 * non-confirmed SSO users (43d14971f). This is the FIRST executed lifecycle-gate
 * criterion; it opens the archetype on the ledger. The same archetype is also
 * observed in the DOM (blocked-action-is-disabled) — one archetype gated at BOTH
 * layers, the layered-determinism thesis made concrete. lifecycle-gate appears in
 * 3/6 corpus repos (docs/corpus-multistack.md).
 */
export const lifecycleGate = archetype('lifecycle-gate', '0.1.0', () => {
  criterion(
    'gate-enforced-server-side',
    'The server enforces the transition\'s precondition: a transition requested on a resource whose precondition is unmet is refused (4xx), and a ready resource\'s transition still succeeds — the FE gate is a courtesy, not the guard.',
    { under: 'success', scope: 'invariant', requires: 'transition', seenIn: ['documenso:6e09a470', 'bitwarden:43d14971f'] },
    mechanical<LifecycleGateExpect>(async ({ act, expect }) => {
      await act();
      expect.gateEnforcedServerSide();
    }),
  );

  criterion(
    'blocked-action-is-disabled',
    'When a precondition is unmet, the FE disables the action and says why — it does not offer a live control that will fail (e.g. publishing offered on an incomplete listing).',
    { under: 'success', scope: 'invariant', requires: 'blocked', seenIn: ['documenso:41ed6c9a', 'documenso:6d754acf'] },
    mechanical<LifecycleGateExpect>(async ({ act, expect }) => {
      await act();
      expect.blockedActionIsDisabled();
    }),
  );
});
