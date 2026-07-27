import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import type { Page } from 'puppeteer-core';
import { parseColor, compositeOver } from '../src/design/color';
import { loadMarkup, loadSurface } from '../src/adapter-design/surface';
import { tapTargetHooks, tapTargetProbe } from '../src/adapter-design/tap-target-integrity';
import { focusVisibleHooks, focusVisibleProbe } from '../src/adapter-design/focus-visible-integrity';
import { layoutShiftHooks, layoutShiftProbe } from '../src/adapter-design/layout-shift-integrity';
import { truncationHooks, truncationProbe } from '../src/adapter-design/truncation-integrity';
import { layoutHooks, layoutProbe } from '../src/adapter-design/layout-integrity';
import { tokenAdherenceHooks, tokenAdherenceProbe } from '../src/adapter-design/token-adherence';
import { accessibleNameHooks, accessibleNameProbe } from '../src/adapter-design/accessible-name';
import { settleUntil } from '../src/adapter-react/settle';
import { runVerification } from '../src/core/run';
import type { Archetype, Probe } from '../src/core/dsl';
import { accessControl } from '../src/archetypes/access-control';
import { credentialAuthority } from '../src/archetypes/credential-authority';
import { resourceUniqueness } from '../src/archetypes/resource-uniqueness';
import { submissionGate } from '../src/archetypes/submission-gate';
import { tokenRotation } from '../src/archetypes/token-rotation';

type FakePageOptions = {
  readonly targetSize?: number;
  readonly afterContent?: () => void;
  readonly evaluate?: (fn: (...args: never[]) => unknown, ...args: unknown[]) => unknown;
  readonly goto?: () => Promise<unknown>;
};

function fakePage(options: FakePageOptions = {}): Page {
  return {
    setViewport: vi.fn(async () => undefined),
    setContent: vi.fn(async (html: string) => {
      document.open();
      document.write(html);
      document.close();
      if (options.targetSize !== undefined) {
        for (const element of document.querySelectorAll('*')) {
          element.getBoundingClientRect = () =>
            ({ width: options.targetSize, height: options.targetSize }) as DOMRect;
        }
      }
      options.afterContent?.();
    }),
    goto: vi.fn(options.goto ?? (async () => undefined)),
    evaluate: vi.fn(async (fn: (...args: never[]) => unknown, ...args: unknown[]) =>
      options.evaluate ? options.evaluate(fn, ...args) : fn(...(args as never[]))),
  } as unknown as Page;
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('CSS color runtime', () => {
  it('parses every supported notation and rejects malformed colors', () => {
    expect(parseColor('')).toBeNull();
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor('#abcd')).toEqual({ r: 170, g: 187, b: 204, a: 221 / 255 });
    expect(parseColor('#112233')).toEqual({ r: 17, g: 34, b: 51, a: 1 });
    expect(parseColor('#11223380')).toEqual({ r: 17, g: 34, b: 51, a: 128 / 255 });
    expect(parseColor('#xyz')).toBeNull();
    expect(parseColor('#12')).toBeNull();
    expect(parseColor('rebeccapurple')).toEqual({ r: 102, g: 51, b: 153, a: 1 });
    expect(parseColor('transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(parseColor('rgb(10, 20, 30)')).toEqual({ r: 10, g: 20, b: 30, a: 1 });
    expect(parseColor('rgba(100% 0% 50% / 25%)')).toEqual({ r: 255, g: 0, b: 128, a: 0.25 });
    expect(parseColor('hsl(120 100% 50%)')).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    expect(parseColor('hsla(240, 100%, 50%, 0.5)')).toEqual({ r: 0, g: 0, b: 255, a: 0.5 });
    expect(parseColor('oklch(100% 0 0 / 50%)')).toEqual({ r: 255, g: 255, b: 255, a: 0.5 });
    expect(parseColor('not-a-color')).toBeNull();
  });

  it('composites translucent colors and preserves opaque colors', () => {
    const opaque = { r: 4, g: 5, b: 6, a: 1 };
    expect(compositeOver(opaque, { r: 255, g: 255, b: 255, a: 1 })).toBe(opaque);
    expect(compositeOver({ r: 255, g: 0, b: 0, a: 0.5 }, { r: 0, g: 0, b: 255, a: 1 }))
      .toEqual({ r: 128, g: 0, b: 128, a: 1 });
  });
});

describe('browser-backed design seams', () => {
  it('loads rendered markup and supplied CSS', async () => {
    const page = fakePage();
    await loadMarkup(page, createElement('button', null, 'Save'), 'button { color: red; }');
    expect(page.setContent).toHaveBeenCalledWith(
      expect.stringContaining('<style>button { color: red; }</style>'),
      { waitUntil: 'load' },
    );
  });

  it('loads URL subjects and fails closed for navigation or missing seams', async () => {
    const page = fakePage();
    await loadSurface(page, { name: 'live', url: 'http://localhost:3000', gotoTimeoutMs: 42 }, 'layout');
    expect(page.goto).toHaveBeenCalledWith(
      'http://localhost:3000',
      { waitUntil: 'networkidle2', timeout: 42 },
    );

    const failing = fakePage({ goto: async () => { throw new Error('offline'); } });
    await expect(loadSurface(failing, { name: 'live', url: 'http://localhost:3000' }, 'layout'))
      .rejects.toThrow('could not load');
    await expect(loadSurface(page, { name: 'empty' }, 'layout')).rejects.toThrow('needs a render() or url seam');
  });

  it('measures tap targets and preserves the pre-act guard', async () => {
    const small = tapTargetProbe(
      { name: 'small', render: () => createElement('button', { 'aria-label': 'Save' }, 'S') },
      fakePage({ targetSize: 20 }),
    );
    expect(() => small.expect.targetsMeetMinimumSize()).toThrow('before act');
    await small.act();
    expect(() => small.expect.targetsMeetMinimumSize()).toThrow('below the 44×44px minimum');

    const largePage = fakePage({ targetSize: 44 });
    const large = tapTargetProbe(
      { name: 'large', render: () => createElement('button', null, 'Save') },
      largePage,
    );
    await large.act();
    expect(() => large.expect.targetsMeetMinimumSize()).not.toThrow();
    expect(tapTargetHooks({ name: 'large' }, largePage).probe).toBeTypeOf('function');
  });

  it('measures invisible focus and accepts explicit visible evidence', async () => {
    const invisible = focusVisibleProbe(
      { name: 'blind', render: () => createElement('button', null, 'Save') },
      fakePage(),
    );
    expect(() => invisible.expect.focusIsVisible()).toThrow('before act');
    await invisible.act();
    expect(() => invisible.expect.focusIsVisible()).toThrow('no visible focus indicator');

    const visiblePage = fakePage({ evaluate: () => [{ label: 'Save', visible: true }] });
    const visible = focusVisibleProbe({ name: 'visible', render: () => createElement('button') }, visiblePage);
    await visible.act();
    expect(() => visible.expect.focusIsVisible()).not.toThrow();
    expect(focusVisibleHooks({ name: 'visible' }, visiblePage).probe).toBeTypeOf('function');
  });

  it('compares loading and loaded anchor positions', async () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      return { top: Number(this.getAttribute('data-top')) } as DOMRect;
    });
    const page = fakePage();
    const stable = layoutShiftProbe(
      {
        name: 'stable',
        renderState: () => createElement('div', { 'data-anchor': true, 'data-top': '24' }),
      },
      page,
    );
    expect(() => stable.expect.reservedSpaceStable()).toThrow('before act');
    await stable.act();
    expect(() => stable.expect.reservedSpaceStable()).not.toThrow();
    expect(layoutShiftHooks({ name: 'stable' }, page).probe).toBeTypeOf('function');

    const missing = layoutShiftProbe(
      { name: 'missing', renderState: () => createElement('div') },
      fakePage(),
    );
    await missing.act();
    expect(() => missing.expect.reservedSpaceStable()).toThrow('No [data-anchor]');

    const noStates = layoutShiftProbe({ name: 'no states' }, fakePage());
    await expect(noStates.act()).rejects.toThrow('needs a renderState() seam');
  });

  it('detects overflowing and clipped browser content', async () => {
    const overflowPage = fakePage({
      afterContent: () => {
        const target = document.querySelector('[data-overflow]')!;
        Object.defineProperties(target, {
          scrollWidth: { value: 120 },
          clientWidth: { value: 20 },
          scrollHeight: { value: 20 },
          clientHeight: { value: 20 },
        });
      },
    });
    const truncation = truncationProbe(
      {
        name: 'overflow',
        render: () => createElement('div', { 'data-overflow': true, style: { overflowX: 'visible' } }, 'A very long label'),
      },
      overflowPage,
    );
    expect(() => truncation.expect.overflowingTextIsTruncated()).toThrow('before act');
    await truncation.act();
    expect(() => truncation.expect.overflowingTextIsTruncated()).toThrow('spills out of its box');
    expect(truncationHooks({ name: 'overflow' }, overflowPage).probe).toBeTypeOf('function');

    const clipPage = fakePage({
      afterContent: () => {
        const target = document.querySelector('[data-clip]')!;
        Object.defineProperties(target, {
          scrollWidth: { value: 80 },
          clientWidth: { value: 20 },
          scrollHeight: { value: 20 },
          clientHeight: { value: 20 },
        });
      },
    });
    const layout = layoutProbe(
      {
        name: 'clip',
        render: () => createElement('div', { 'data-clip': true, style: { overflowX: 'hidden' } }, 'Clipped'),
      },
      clipPage,
    );
    expect(() => layout.expect.contentFits()).toThrow('before act');
    await layout.act();
    expect(() => layout.expect.contentFits()).toThrow('clips 60px on x');
    expect(layoutHooks({ name: 'clip' }, clipPage).probe).toBeTypeOf('function');
  });
});

describe('DOM-backed design contracts', () => {
  it('reports off-scale authored values and accepts an unstyled surface', async () => {
    const offScale = tokenAdherenceProbe(
      {
        name: 'off scale',
        render: () => createElement('div', {
          style: { color: 'rgb(1, 2, 3)', padding: '3px', borderRadius: '7px', fontSize: '13px' },
        }),
      },
      { checkComputed: true },
    );
    expect(() => offScale.expect.usesTokensOnly()).toThrow('before act');
    await offScale.act();
    expect(() => offScale.expect.usesTokensOnly()).toThrow('off the design token scale');

    const clean = tokenAdherenceProbe({ name: 'clean', render: () => createElement('div') });
    await clean.act();
    expect(() => clean.expect.usesTokensOnly()).not.toThrow();
    expect(tokenAdherenceHooks({ name: 'clean' }).probe).toBeTypeOf('function');
  });

  it('resolves the supported accessible-name sources', async () => {
    const probe = accessibleNameProbe({
      name: 'names',
      render: () => createElement(
        'div',
        null,
        createElement('span', { id: 'label-id' }, 'By id'),
        createElement('button', { 'aria-labelledby': 'label-id' }),
        createElement('button', { 'aria-label': 'By aria' }),
        createElement('input', { type: 'submit', value: 'Submit' }),
        createElement('label', { htmlFor: 'email' }, 'Email'),
        createElement('input', { id: 'email' }),
        createElement('label', null, 'Wrapped', createElement('textarea')),
        createElement('a', { href: '#next' }, createElement('img', { alt: 'Next' })),
        createElement('button', { title: 'By title' }),
        createElement('button', { hidden: true }),
        createElement('button', { 'aria-hidden': 'true' }),
      ),
    });
    expect(() => probe.expect.everyControlNamed()).toThrow('before act');
    await probe.act();
    expect(() => probe.expect.everyControlNamed()).not.toThrow();
    expect(accessibleNameHooks({ name: 'names' }).probe).toBeTypeOf('function');
  });
});

describe('settleUntil', () => {
  it('returns immediately, polls observable work, and performs one final deadline check', async () => {
    expect(await settleUntil(() => true)).toBe(true);
    let attempts = 0;
    expect(await settleUntil(() => ++attempts > 1, 50, 0)).toBe(true);
    expect(await settleUntil(() => false, 0)).toBe(false);
  });
});

describe('catalog archetype execution', () => {
  it('executes every mechanical body that has no dedicated JavaScript adapter', async () => {
    const archetypes: Archetype[] = [
      accessControl,
      credentialAuthority,
      resourceUniqueness,
      submissionGate,
      tokenRotation,
    ];
    for (const archetype of archetypes) {
      let acts = 0;
      const verdict = await runVerification(archetype.name, archetype, {
        probe: () => ({
          act: async () => { acts += 1; },
          expect: new Proxy({}, { get: () => () => undefined }),
        }) as Probe,
      });
      expect(verdict.outcome).toBe('pass');
      expect(acts).toBe(archetype.criteria.length);
    }
  });
});
