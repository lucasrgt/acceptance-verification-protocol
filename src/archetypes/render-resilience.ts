import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `render-resilience` criteria speak; the adapter implements it. */
export interface RenderResilienceExpect {
  /** The surface rendered the empty/null/malformed data it can actually receive WITHOUT throwing — it degraded, it didn't white-screen. */
  survivesMalformedData(): void;
}

/**
 * The `render-resilience` archetype — "a surface renders the data it can actually
 * receive without crashing". The canonical happy-path-fixture escape: a component
 * assumes a data shape (a non-null user, a present array, a string field), the test
 * ran with the happy fixture and passed, and production hit a null/empty/malformed
 * value and white-screened. This is AVP's thesis in its purest form — only RUNNING
 * the surface with the data it can receive finds it; a unit test on the happy shape
 * never does. Distinct from state-completeness (STATIC: does it DECLARE an empty
 * branch) — a component with an empty state still crashes on a null NESTED field.
 *
 * Overwhelmingly grounded (every codebase has these): cal.com alone has 44 "crash"
 * fixes — "a.trim is not a function" (000324c0), "handle empty location in event
 * types" (013e6143); documenso "prevent crash when removing last dropdown option"
 * (43fe5584), "handle empty object as fieldMeta" (0ef85b47).
 */
export const renderResilience = archetype('render-resilience', '0.1.0', () => {
  criterion(
    'survives-malformed-data',
    'Rendering the surface with the empty/null/malformed data it can actually receive does not throw: it degrades to a fallback or empty state instead of crashing the screen. A guard for a happy-path shape is not optional — the real data is not always the fixture.',
    { under: 'success', scope: 'invariant', requires: 'malformed', seenIn: ['calcom:000324c0', 'calcom:013e6143', 'documenso:43fe5584'] },
    mechanical<RenderResilienceExpect>(async ({ act, expect }) => {
      await act();
      expect.survivesMalformedData();
    }),
  );
});
