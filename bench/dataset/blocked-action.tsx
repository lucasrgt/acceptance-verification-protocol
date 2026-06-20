/**
 * Faithful reproduction of the FE half of the lifecycle gate (the marketplace's
 * "publishing offered on an incomplete listing"; documenso's "disable cert download
 * when document not complete"): with a precondition unmet, the action must be
 * disabled AND say why — not a live control the user clicks into a failure.
 *
 * The listing is incomplete (precondition unmet). A correct Publish button is
 * disabled, with a reason.
 *
 * Variants:
 *   good           : disabled button + a visible reason
 *   enabled         : a live (clickable) button — the user can attempt the blocked action
 *   enabled-styled  : looks disabled (a className) but isn't actually disabled
 *   aria-false      : explicitly aria-disabled="false" (a live control that lies)
 *   no-reason       : disabled, but no reason is shown
 */
export type BlockedVariant = 'good' | 'enabled' | 'enabled-styled' | 'aria-false' | 'no-reason';

function Screen({ variant }: { variant: BlockedVariant }) {
  const reason = <p>Complete all required fields to publish.</p>;
  return (
    <div>
      <h1>Incomplete listing</h1>
      {variant === 'good' && (
        <>
          <button type="button" disabled>
            Publish
          </button>
          {reason}
        </>
      )}
      {variant === 'enabled' && (
        <>
          <button type="button">Publish</button>
          {reason}
        </>
      )}
      {variant === 'enabled-styled' && (
        <>
          <button type="button" className="is-disabled">
            Publish
          </button>
          {reason}
        </>
      )}
      {variant === 'aria-false' && (
        <>
          <button type="button" aria-disabled="false">
            Publish
          </button>
          {reason}
        </>
      )}
      {variant === 'no-reason' && (
        <button type="button" disabled>
          Publish
        </button>
      )}
    </div>
  );
}

export const buildBlockedScreen = (variant: BlockedVariant) => () => <Screen variant={variant} />;
