import type { ReactElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { act } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from './msw-server';
import { AvpFail, type Probe } from '../core/dsl';
import type { Condition } from '../core/types';
import type { VerifyHooks } from '../core/run';
import type { DataHonestyExpect } from '../archetypes/data-honesty';
import { detailProbe, isDetailSubject, type DetailHonestySubject } from './data-detail';

/**
 * Descriptor of a `data-honesty` subject: the seams needed to compare what an API
 * returns against what the component renders. Deliberately different from
 * `ActionEffectSubject` — no action, no draft — to exercise the neutral core.
 */
export interface DataHonestySubject {
  readonly name: string;
  /** Mounts the component (already wrapped in whatever providers it needs). */
  readonly render: () => ReactElement;
  /** The collection endpoint the component reads. */
  readonly endpoint: { readonly method: string; readonly path: string };
  /** The rendered collection: each item is queried by this role. */
  readonly items: { readonly role: string };
  /** The response that returns ZERO rows (drives the `empty` condition). */
  readonly emptyResponse: unknown;
  /** A response whose rows carry NO media (drives the `partial` condition). Enables `no-fabricated-media`. */
  readonly mediaResponse?: unknown;
  /** Hosts/patterns that betray fabricated media if they surface as an `<img src>`. */
  readonly fabricationMarkers: readonly (string | RegExp)[];
  /** A populated response with a known row count (drives the `success` condition). Enables `count-matches-source`. */
  readonly countResponse?: readonly unknown[];
}

interface DrivenData {
  itemCount(): number;
  imageSources(): string[];
}

/** Forces the data `condition` on the endpoint, mounts, and lets the read settle. */
async function driveData(subject: DataHonestySubject, condition: Condition): Promise<DrivenData> {
  cleanup();
  const verb = subject.endpoint.method.toLowerCase() as 'get' | 'post';
  const register = http[verb] as typeof http.get;
  const body =
    condition.id === 'empty'
      ? subject.emptyResponse
      : condition.id === 'partial'
        ? (subject.mediaResponse ?? subject.emptyResponse)
        : (subject.countResponse ?? subject.emptyResponse); // success
  server.use(register(subject.endpoint.path, () => HttpResponse.json(body as object)));

  render(subject.render());
  await act(async () => {
    await new Promise((r) => setTimeout(r, 60));
  });

  return {
    itemCount: () => screen.queryAllByRole(subject.items.role).length,
    imageSources: () =>
      Array.from(document.querySelectorAll('img'))
        .map((img) => img.getAttribute('src') ?? '')
        .filter((src) => src.length > 0),
  };
}

/** The React adapter's `data-honesty` probe. */
export function dataProbe(subject: DataHonestySubject, condition: Condition): Probe<DataHonestyExpect> {
  let driven: DrivenData | null = null;
  const seen = (): DrivenData => {
    if (!driven) throw new AvpFail('probe used before act() — call `await act()` first.');
    return driven;
  };

  return {
    async act() {
      driven = await driveData(subject, condition);
    },
    expect: {
      rendersNoFixtures() {
        const count = seen().itemCount();
        if (count > 0) {
          throw new AvpFail(
            `The API returned no rows, yet ${count} item(s) rendered — the UI fell back to fixture/demo data. Render the empty state instead.`,
            { renderedItems: count },
          );
        }
      },
      noFabricatedMedia() {
        const srcs = seen().imageSources();
        // Under a no-media response, ANY remote image is fabricated — not only the
        // hosts on the markers list (which a stock source can always sidestep).
        const isRemote = (src: string) => /^https?:\/\//i.test(src);
        const fabricated = srcs.filter(
          (src) =>
            isRemote(src) ||
            subject.fabricationMarkers.some((m) => (typeof m === 'string' ? src.includes(m) : m.test(src))),
        );
        if (fabricated.length > 0) {
          throw new AvpFail(
            `A missing image rendered fabricated media (${fabricated.join(', ')}) — render a neutral placeholder (local/inline), not a remote stock photo or generated face.`,
            { fabricated },
          );
        }
      },
      noRawIdFlash() {
        throw new AvpFail('noRawIdFlash needs a detail subject (declare `rawId`); not applicable to a list subject.');
      },
      countMatchesSource() {
        const expected = subject.countResponse?.length ?? 0;
        const rendered = seen().itemCount();
        if (rendered !== expected) {
          throw new AvpFail(
            `The API returned ${expected} row(s), but ${rendered} rendered — the list ${rendered < expected ? 'silently dropped' : 'invented'} rows (a client-side filter or fixture merge). Render exactly what the source returned; move filtering to the query.`,
            { apiRows: expected, renderedItems: rendered },
          );
        }
      },
    },
  };
}

/**
 * The React adapter's hooks for `data-honesty`. Dispatches by subject shape: a
 * list subject runs the fixture/media criteria; a detail subject runs the
 * flash-of-id criterion. Each criterion is gated to the subject that can observe it.
 */
export function dataHonestyHooks(subject: DataHonestySubject | DetailHonestySubject): VerifyHooks {
  const detail = isDetailSubject(subject);
  return {
    probe: (condition) => (detail ? detailProbe(subject) : dataProbe(subject, condition)),
    applies: (c) => {
      if (detail) {
        return c.requires === 'detail' ? null : 'Detail subject — list criterion not applicable.';
      }
      if (c.requires === 'detail') return 'List subject — flash-of-id not applicable.';
      if (c.requires === 'media' && (subject as DataHonestySubject).mediaResponse === undefined) {
        return 'Subject declares no mediaResponse — criterion not applicable.';
      }
      if (c.requires === 'count' && (subject as DataHonestySubject).countResponse === undefined) {
        return 'Subject declares no countResponse — count-matches-source not applicable.';
      }
      return null;
    },
  };
}
