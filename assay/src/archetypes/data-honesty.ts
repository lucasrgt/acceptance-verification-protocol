import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `data-honesty` criteria speak; the adapter implements it. */
export interface DataHonestyExpect {
  /** No fixture/demo rows were rendered when the API returned nothing. */
  rendersNoFixtures(): void;
  /** No stock photo / generated face was rendered for a missing image. */
  noFabricatedMedia(): void;
  /** No raw entity id was shown before the resolved name arrived (no flash-of-id). */
  noRawIdFlash(): void;
  /** The number of items rendered equals the number the API returned (no dropped/invented rows). */
  countMatchesSource(): void;
}

/**
 * The `data-honesty` archetype — "rendered data traces to a real source".
 *
 * The second archetype, deliberately unlike `action-effect`: there is no action,
 * no draft, no projection — just a render wired to an API response. It exists to
 * prove the core is neutral (a different subject + probe plug into the same
 * runner). It targets the LLM-specific escape class: generators love plausible
 * placeholder data, and it ships. Mined from the tourism project's fix history
 * (see docs/catalog.md, archetype #8).
 */
export const dataHonesty = archetype('data-honesty', '0.1.0', () => {
  criterion(
    'no-fixture-fallback',
    'When the API returns no rows, the UI renders the empty state — it never falls back to fixture/demo rows.',
    { under: 'empty', scope: 'invariant', seenIn: ['8ec5dae5', '74f546d1'] },
    mechanical<DataHonestyExpect>(async ({ act, expect }) => {
      await act();
      expect.rendersNoFixtures();
    }),
  );

  criterion(
    'no-fabricated-media',
    'A missing image renders a neutral placeholder — never a stock photo or a randomly generated face.',
    { under: 'partial', scope: 'invariant', requires: 'media', seenIn: ['dfb23261'] },
    mechanical<DataHonestyExpect>(async ({ act, expect }) => {
      await act();
      expect.noFabricatedMedia();
    }),
  );

  criterion(
    'no-raw-id-flash',
    'A detail view renders resolved data (a name) or a skeleton — never a raw entity id flashed before the name resolves.',
    { under: 'success', scope: 'invariant', requires: 'detail', seenIn: ['projp:ce04d0f', 'projp:33a0d5a'] },
    mechanical<DataHonestyExpect>(async ({ act, expect }) => {
      await act();
      expect.noRawIdFlash();
    }),
  );

  criterion(
    'count-matches-source',
    'The number of items rendered equals the number the API returned — a client-side filter or fixture merge never silently drops or invents rows.',
    { under: 'success', scope: 'invariant', requires: 'count', seenIn: ['documenso:b8e08e88', 'documenso:5f4e0ccf'] },
    mechanical<DataHonestyExpect>(async ({ act, expect }) => {
      await act();
      expect.countMatchesSource();
    }),
  );
});
