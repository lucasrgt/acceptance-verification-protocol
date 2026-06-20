/**
 * Faithful reproduction of the icon-correctness escape: a control shows an icon whose
 * MEANING doesn't fit its action/label. Grounded in real wrong-icon fixes: Gitea "use
 * repo-forked icon to display forks count" (edf0dfd1) and "issue close timeline icon"
 * (3102c04c), and Mastodon "outdated icon in notifications banner" (9576434d).
 *
 * A toolbar of icon controls, each labelled. Icons are marked with `data-icon=<glyph>`
 * (the DS convention) and the control carries the accessible label — the adapter pairs
 * them as the judge's evidence.
 *
 * Variants (each swaps one icon for a semantically wrong glyph):
 *   good        : every icon fits — Back→arrow-left, Forks→git-fork, Search→search, Delete→trash
 *   wrong-back  : the Back control shows a trash glyph (the back arrow is gone)
 *   wrong-forks : the Forks count shows a generic file glyph (the gitea:edf0dfd1 escape)
 *   wrong-search: the Search control shows a bell glyph
 */
export type IconVariant = 'good' | 'wrong-back' | 'wrong-forks' | 'wrong-search';

function iconOf(variant: IconVariant, control: 'back' | 'forks' | 'search'): string {
  const right = { back: 'arrow-left', forks: 'git-fork', search: 'search' } as const;
  if (variant === 'wrong-back' && control === 'back') return 'trash';
  if (variant === 'wrong-forks' && control === 'forks') return 'file';
  if (variant === 'wrong-search' && control === 'search') return 'bell';
  return right[control];
}

function Toolbar({ variant }: { variant: IconVariant }) {
  return (
    <div>
      <button aria-label="Back">
        <span data-icon={iconOf(variant, 'back')} />
      </button>
      <button aria-label="Forks">
        <span data-icon={iconOf(variant, 'forks')} /> 12
      </button>
      <button aria-label="Search">
        <span data-icon={iconOf(variant, 'search')} />
      </button>
      <button aria-label="Delete">
        <span data-icon="trash" />
      </button>
    </div>
  );
}

export const buildIconToolbar = (variant: IconVariant) => () => <Toolbar variant={variant} />;
