import type { ReactElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { act } from 'react';
import { http, HttpResponse, delay } from 'msw';
import { server } from './msw-server';
import { AvpFail, type Probe } from '../core/dsl';
import type { DataHonestyExpect } from '../archetypes/data-honesty';

/**
 * Descriptor of a `data-honesty` DETAIL subject: a screen that resolves an entity
 * then a name. To observe the flash-of-id gap, the name endpoint is delayed and
 * the screen is sampled while the name is still resolving.
 */
export interface DetailHonestySubject {
  readonly name: string;
  readonly render: () => ReactElement;
  /** The entity endpoint (resolves immediately). */
  readonly entityEndpoint: { readonly method: string; readonly path: string };
  /** The entity body. A GOOD payload already carries the resolved name; a BAD one carries only the id. */
  readonly entityResponse: unknown;
  /** The name endpoint a BAD screen chains to (delayed here so the gap is observable). */
  readonly nameEndpoint: { readonly method: string; readonly path: string };
  readonly nameResponse: unknown;
  /** The raw id string that must never reach the screen. */
  readonly rawId: string;
}

const present = (marker: string): boolean => (document.body.textContent ?? '').includes(marker);

/** The React adapter's `data-honesty` detail probe (flash-of-id, timing-based). */
export function detailProbe(subject: DetailHonestySubject): Probe<DataHonestyExpect> {
  let flashed = false;
  let acted = false;

  return {
    async act() {
      cleanup();
      const everb = subject.entityEndpoint.method.toLowerCase() as 'get' | 'post';
      const nverb = subject.nameEndpoint.method.toLowerCase() as 'get' | 'post';
      server.use(
        (http[everb] as typeof http.get)(subject.entityEndpoint.path, () =>
          HttpResponse.json(subject.entityResponse as object),
        ),
        (http[nverb] as typeof http.get)(subject.nameEndpoint.path, async () => {
          await delay(150); // keep the name resolving so the gap is observable
          return HttpResponse.json(subject.nameResponse as object);
        }),
      );
      render(subject.render());
      // sample the gap: the entity has resolved, the name has not.
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });
      flashed = present(subject.rawId);
      // let the name finish so no update dangles past the test.
      await act(async () => {
        await new Promise((r) => setTimeout(r, 160));
      });
      acted = true;
    },
    expect: {
      rendersNoFixtures() {
        throw new AvpFail('rendersNoFixtures needs a list subject; not applicable to a detail subject.');
      },
      noFabricatedMedia() {
        throw new AvpFail('noFabricatedMedia needs a list subject; not applicable to a detail subject.');
      },
      noRawIdFlash() {
        if (!acted) throw new AvpFail('probe used before act() — call `await act()` first.');
        if (flashed) {
          throw new AvpFail(
            `The detail rendered a raw id ("${subject.rawId}") before the resolved name arrived — a flash of id. Render a skeleton until the name resolves, or include the resolved name in the entity payload (one query).`,
            { rawId: subject.rawId },
          );
        }
      },
    },
  };
}

/** True for a detail subject (vs the list subject). */
export function isDetailSubject(subject: unknown): subject is DetailHonestySubject {
  return typeof subject === 'object' && subject !== null && typeof (subject as DetailHonestySubject).rawId === 'string';
}
