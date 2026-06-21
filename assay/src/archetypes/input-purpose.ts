import { archetype, criterion, mechanical } from '../core/dsl';

/** The assertion vocabulary `input-purpose` criteria speak; the design adapter implements it. */
export interface InputPurposeExpect {
  /** Every input collecting a known kind of user data declares its purpose via `autocomplete`. */
  personalFieldsDeclarePurpose(): void;
}

/**
 * The `input-purpose` archetype — WCAG 1.3.5 (Identify Input Purpose). An input that
 * collects a known kind of personal data (email, password, phone, name, address…) must
 * declare its purpose with an `autocomplete` token, so a browser can autofill it and an
 * assistive tech can describe it. The escape the happy-path test never sees: the field
 * works for a sighted manual typist and passes — but offers no autofill and no programmatic
 * purpose. Grounding is a recurring "add autocomplete" cluster, not a one-off.
 *
 * Scoped tight to keep false-alarm at zero — it only opines on fields whose purpose is
 * UNAMBIGUOUS (an `email`/`tel`/`password` type, or a high-confidence name/id pattern like
 * `email`, `phone`, `first-name`, `postal-code`). A search box or an opaque field gets no
 * opinion. And a present `autocomplete` (any value, including `off`) is the author's explicit
 * decision — the escape is its ABSENCE, mirroring image-alt's decorative branch.
 *
 * Faithfully grounded in cal.com's autocomplete cluster: "add autocomplete for inputs —
 * name, phone, location" (#24422), "add autocomplete to login and signup" (#21065),
 * "Disable autocomplete on password field" (#6705), "Enable Autocomplete" (#2645).
 */
export const inputPurpose = archetype('input-purpose', '0.1.0', () => {
  criterion(
    'personal-fields-declare-purpose',
    'Every input that collects a known kind of personal data — identified unambiguously by its type (`email`/`tel`/`password`) or a high-confidence name/id (email, phone, first/last name, street, postal code, organization, credit card) — declares an `autocomplete` attribute (WCAG 1.3.5 Identify Input Purpose). A field whose purpose is opaque (a search box, an arbitrary text field) gets no opinion, and any present `autocomplete` (even `off`) is the author\'s decision; the escape is a personal-data field with NO autocomplete at all — no autofill, no programmatic purpose.',
    { under: 'success', scope: 'invariant', substrate: 'dom', requires: 'inputs', seenIn: ['calcom:24422', 'calcom:21065', 'calcom:6705', 'calcom:2645'] },
    mechanical<InputPurposeExpect>(async ({ act, expect }) => {
      await act();
      expect.personalFieldsDeclarePurpose();
    }),
  );
});
