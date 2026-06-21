import { useState } from 'react';

/**
 * Faithful reproduction of the double-submit escape (`single-flight`): a primary
 * action that doesn't guard itself while in flight fires twice on a fast
 * double-activation, creating a duplicate. Mined across two repos: cal.com "disable
 * button and handle submit when loading" (d7226fc3), "double bookings on seated
 * event" (5b50a469); documenso "disable signing pad while submitting form"
 * (56683aa9). Distinct from idempotent-retry — no failure is involved, only
 * concurrency of clicks.
 *
 * The driver activates the control twice in quick succession against a slow
 * endpoint, so a correct guard (disabling on submit) makes the second a no-op.
 *
 * Variants (every BAD one double-fires; only `good` is single-flight):
 *   good        : disables the button while in flight (real `disabled` attr)
 *   unguarded   : no guard at all — both clicks fire
 *   aria-only   : sets aria-disabled (a lie — doesn't block the click) but stays live
 *   class-only  : applies a "disabled" className (visual only), stays live
 *   late-guard  : sets the in-flight flag AFTER the await — useless for concurrent clicks
 */
export type DoubleSubmitVariant = 'good' | 'unguarded' | 'aria-only' | 'class-only' | 'late-guard';

const API = 'http://localhost/api';

function Booking({ variant }: { variant: DoubleSubmitVariant }) {
  const [busy, setBusy] = useState(false);
  async function book() {
    if (variant === 'late-guard') {
      await fetch(`${API}/book`, { method: 'POST' }); // guard set after the effect — too late
      setBusy(true);
      return;
    }
    setBusy(true);
    try {
      await fetch(`${API}/book`, { method: 'POST' });
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      onClick={book}
      disabled={variant === 'good' && busy}
      aria-disabled={variant === 'aria-only' && busy}
      className={variant === 'class-only' && busy ? 'is-disabled' : undefined}
    >
      Book
    </button>
  );
}

export const buildBookingButton = (variant: DoubleSubmitVariant) => () => <Booking variant={variant} />;
