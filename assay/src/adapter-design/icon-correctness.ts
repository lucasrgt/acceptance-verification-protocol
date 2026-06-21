import { cleanup, render } from '@testing-library/react';
import { act } from 'react';
import { AvpFail, type Judge, type Probe } from '../core/dsl';
import type { VerifyHooks } from '../core/run';
import type { ReactDesignSubject } from './subject';

export interface IconEvidence {
  /** Every rendered icon (`[data-icon]`) with the accessible label of the control it belongs to. */
  readonly icons: ReadonlyArray<{ readonly icon: string; readonly label: string }>;
}

const settle = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

/** The accessible meaning of an icon's control: its host's aria-label, else its trimmed text, else the icon's own label. */
function labelFor(el: HTMLElement): string {
  const host = el.closest<HTMLElement>('button, a, [role="button"], [data-control]') ?? el;
  const aria = host.getAttribute('aria-label') ?? el.getAttribute('aria-label');
  if (aria) return aria.trim();
  const text = (host.textContent ?? '').trim();
  return text || (el.dataset.iconLabel ?? '');
}

/** Read every icon on the surface plus the meaning (label/action) of its control — the judge's evidence. */
function collectIcons(): IconEvidence {
  const icons = Array.from(document.body.querySelectorAll<HTMLElement>('[data-icon]')).map((el) => ({
    icon: el.dataset.icon ?? '',
    label: labelFor(el),
  }));
  return { icons };
}

/**
 * The design adapter's `icon-correctness` hooks — a MODEL criterion, so no mechanical probe:
 * it mounts the surface, gathers each icon + its control's label as evidence, and hands it to
 * the injected judge. The probe stub is never invoked (the core only calls it for mechanical
 * criteria); without a judge the criterion is `skipped`.
 */
export function iconHooks(subject: ReactDesignSubject, opts: { readonly judge?: Judge } = {}): VerifyHooks {
  return {
    probe: () => {
      throw new AvpFail('icon-correctness is a model criterion — it has no mechanical probe.');
    },
    async gatherEvidence(): Promise<IconEvidence> {
      if (!subject.render) throw new AvpFail('icon-correctness needs a render() seam.');
      cleanup();
      render(subject.render());
      await settle();
      return collectIcons();
    },
    judge: opts.judge,
  };
}
