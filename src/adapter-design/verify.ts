import type { Archetype, Judge } from '../core/dsl';
import type { Verdict } from '../core/types';
import { runVerification, type VerifyHooks } from '../core/run';
import { tokenAdherenceHooks } from './token-adherence';
import { themeParityHooks } from './theme-parity';
import { typeHierarchyHooks } from './type-hierarchy';
import { compositionHooks } from './composition-canonical';
import { stateCoverageHooks } from './state-coverage';
import { colorContrastHooks } from './color-contrast';
import { spacingRhythmHooks } from './spacing-rhythm';
import { accessibleNameHooks } from './accessible-name';
import { imageAltHooks } from './image-alt';
import { iconHooks } from './icon-correctness';

type NamedSubject = { readonly name: string };

/** Options for a design run — the judge is needed only by `model`-oracle archetypes (icon-correctness). */
export interface DesignOptions {
  readonly judge?: Judge;
}

/**
 * Per-archetype hooks for the DESIGN adapter. Same shape as the React and HTTP
 * adapters — a new design archetype is one entry here — and it reuses the SAME neutral
 * `runVerification` (src/core/run.ts). That a design-fidelity archetype runs through
 * the identical core as the DOM and HTTP archetypes is the proof Assay Design is a
 * sibling adapter, not a fork of the protocol. The opts bag carries the judge to the
 * model-oracle archetypes; mechanical archetypes ignore it.
 */
const REGISTRY: Record<string, (subject: never, opts: DesignOptions) => VerifyHooks> = {
  'token-adherence': tokenAdherenceHooks as (subject: never) => VerifyHooks,
  'theme-parity': themeParityHooks as (subject: never) => VerifyHooks,
  'type-hierarchy': typeHierarchyHooks as (subject: never) => VerifyHooks,
  'composition-canonical': compositionHooks as (subject: never) => VerifyHooks,
  'state-coverage': stateCoverageHooks as (subject: never) => VerifyHooks,
  'color-contrast': colorContrastHooks as (subject: never) => VerifyHooks,
  'spacing-rhythm': spacingRhythmHooks as (subject: never) => VerifyHooks,
  'accessible-name': accessibleNameHooks as (subject: never) => VerifyHooks,
  'image-alt': imageAltHooks as (subject: never) => VerifyHooks,
  'icon-correctness': iconHooks as (subject: never, opts: DesignOptions) => VerifyHooks,
};

/** Runs a design archetype against a surface (jsdom + computed style) and returns a Verdict. */
export async function verifyDesign(archetype: Archetype, subject: NamedSubject, opts: DesignOptions = {}): Promise<Verdict> {
  const build = REGISTRY[archetype.name];
  if (!build) {
    throw new Error(`The design adapter has no hooks for archetype "${archetype.name}".`);
  }
  return runVerification(subject.name, archetype, build(subject as never, opts));
}
