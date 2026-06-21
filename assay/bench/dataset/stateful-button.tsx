import { tokens } from '../../src/design/tokens';

/**
 * Faithful reproduction of the state-coverage escape: an interactive state that is set
 * but not painted. Grounded in "ui(Button): drive disabled dimming via inline style,
 * not a NativeWind class" (c86c36b3 — the dimming never applied) and "single upload
 * spinner" (f842d42c). A disabled button must look dimmed; a loading button must show a
 * spinner — otherwise the user can't perceive the state.
 *
 * Variants (good paints every state; each mutant collapses one to look like default):
 *   good               : disabled dims (opacity + muted), loading shows a spinner
 *   disabled-not-dimmed: disabled looks identical to default (the c86c36b3 escape)
 *   loading-no-spinner : loading looks identical to default (no spinner)
 *   all-flat           : no state is painted — all identical to default
 */
export type StateVariant = 'good' | 'disabled-not-dimmed' | 'loading-no-spinner' | 'all-flat';

function Button({ variant, state }: { variant: StateVariant; state: string }) {
  const paintDisabled = state === 'disabled' && variant !== 'disabled-not-dimmed' && variant !== 'all-flat';
  const showSpinner = state === 'loading' && variant !== 'loading-no-spinner' && variant !== 'all-flat';
  const style: React.CSSProperties = {
    opacity: paintDisabled ? '0.5' : '1',
    color: paintDisabled ? tokens.color.muted : tokens.color.text,
  };
  return (
    <span>
      <button data-testid="control" style={style} disabled={state === 'disabled'}>
        Save
      </button>
      {showSpinner && <span data-testid="spinner" aria-label="loading" />}
    </span>
  );
}

export const buildStatefulButton = (variant: StateVariant) => (state: string) => <Button variant={variant} state={state} />;
