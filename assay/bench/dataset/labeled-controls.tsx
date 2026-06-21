/**
 * Faithful reproduction of the accessible-name escape: an interactive control that
 * reaches the accessibility tree with NO accessible name. Grounded in cal.com's
 * accessible-name fixes — "Add aria-label to progressToast close button" (8cace7f7),
 * "added aria-label to timezone input" (a0e4580f), "added aria-label to prev and next
 * month buttons" (bf9be591), "replace title with aria-label to avoid multiple
 * tooltips" (02a86f1d).
 *
 * A small toolbar/form with four named controls + a plain text button. GOOD labels
 * every control; each mutant strips the name off exactly ONE control in a distinct way:
 *   good             : every control named (text, aria-label, <label for>, name-from-content)
 *   icon-button-bare : the close button loses its aria-label — only an aria-hidden ✕ remains
 *   input-no-label   : the search input loses its <label> — only a placeholder remains
 *   link-icon-only   : the next link loses its aria-label — only an aria-hidden › remains
 *   label-in-hidden  : the menu button's text is wrapped in an aria-hidden span — visible but a11y-empty
 */
export type LabeledControlsVariant = 'good' | 'icon-button-bare' | 'input-no-label' | 'link-icon-only' | 'label-in-hidden';

function Controls({ variant }: { variant: LabeledControlsVariant }) {
  return (
    <div>
      {/* always named by its text — the control that proves GOOD isn't vacuously empty */}
      <button type="button">Save</button>

      {/* icon-only close button — named by aria-label unless the bare mutant strips it */}
      <button type="button" aria-label={variant === 'icon-button-bare' ? undefined : 'Close'}>
        <span aria-hidden="true">✕</span>
      </button>

      {/* search input — named by its associated label unless the no-label mutant omits it */}
      {variant !== 'input-no-label' && <label htmlFor="q">Search</label>}
      <input id="q" type="text" placeholder="Search" />

      {/* next link — named by aria-label unless the icon-only mutant strips it */}
      <a href="/next" aria-label={variant === 'link-icon-only' ? undefined : 'Next page'}>
        <span aria-hidden="true">›</span>
      </a>

      {/* menu button — named by its content unless the text is hidden from the a11y tree */}
      <button type="button">
        <span aria-hidden={variant === 'label-in-hidden' ? 'true' : undefined}>Menu</span>
      </button>
    </div>
  );
}

export const buildLabeledControls = (variant: LabeledControlsVariant) => () => <Controls variant={variant} />;
