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
};

/** Runs a geometry design archetype against a surface in a real browser page. */
export async function verifyDesignBrowser(archetype: Archetype, subject: ReactDesignSubject, page: Page): Promise<Verdict> {
  const build = REGISTRY[archetype.name];
  if (!build) {
    throw new Error(`The browser design adapter has no hooks for archetype "${archetype.name}".`);
  }
  return runVerification(subject.name, archetype, build(subject, page));
}
