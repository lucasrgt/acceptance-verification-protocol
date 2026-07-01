import type { Page } from 'puppeteer-core';
import type { Archetype } from '../core/dsl';
import type { Verdict } from '../core/types';
import { runVerification, type VerifyHooks } from '../core/run';
import { layoutHooks } from './layout-integrity';
import { layerHooks } from './layer-integrity';
import { responsiveHooks } from './responsive-integrity';
import { readingOrderHooks } from './reading-order-integrity';
import { rtlHooks } from './rtl-integrity';
import { tapTargetHooks } from './tap-target-integrity';
import { layoutShiftHooks } from './layout-shift-integrity';
import { focusVisibleHooks } from './focus-visible-integrity';
import { truncationHooks } from './truncation-integrity';
import type { ReactDesignSubject } from './subject';

/**
 * The GEOMETRY dispatcher — design archetypes that need a real layout engine. Same
 * shape as the jsdom design dispatcher (verifyDesign) and reusing the SAME neutral
 * `runVerification`, but the hooks take a live browser `page`. Adding a geometry
 * archetype = one entry here. The browser is owned by the caller (launched once,
 * reused) so a whole suite shares one Chrome.
 */
const REGISTRY: Record<string, (subject: ReactDesignSubject, page: Page) => VerifyHooks> = {
  'layout-integrity': layoutHooks,
  'layer-integrity': layerHooks,
  'responsive-integrity': responsiveHooks,
  'reading-order-integrity': readingOrderHooks,
  'rtl-integrity': rtlHooks,
  'tap-target-integrity': tapTargetHooks,
  'layout-shift-integrity': layoutShiftHooks,
  'focus-visible-integrity': focusVisibleHooks,
  'truncation-integrity': truncationHooks,
};

/** Options for a geometry run — the ADR 0002 escape hatch for off-catalog geometry archetypes. */
export interface BrowserDesignOptions {
  readonly hooks?: (subject: ReactDesignSubject, page: Page) => VerifyHooks;
}

/**
 * Runs a geometry design archetype against a surface in a real browser page. Catalog
 * archetypes use the registry's calibrated hooks; `options.hooks` binds an off-catalog
 * geometry archetype (ADR 0002).
 */
export async function verifyDesignBrowser(
  archetype: Archetype,
  subject: ReactDesignSubject,
  page: Page,
  options: BrowserDesignOptions = {},
): Promise<Verdict> {
  const build = REGISTRY[archetype.name] ?? options.hooks;
  if (!build) {
    throw new Error(
      `The browser design adapter has no hooks for archetype "${archetype.name}" — pass { hooks } to verifyDesignBrowser() for an off-catalog criterion (ADR 0002).`,
    );
  }
  return runVerification(subject.name, archetype, build(subject, page));
}
