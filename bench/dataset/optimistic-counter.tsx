import { useState } from 'react';

/**
 * Faithful reproduction of the optimistic-drift escape (the marketplace's count-based
 * optimistic state never reconciled): a Like button optimistically bumps the count,
 * but when the server returns the AUTHORITATIVE value the UI doesn't reconcile, so the
 * count drifts permanently. The class recurs as "reconcile/sync state to source of
 * truth" fixes (documenso eb45d1e5, ed7a0011).
 *
 * Starts at 10; the server's authoritative value after a like is 12 (others also
 * liked). A correct UI settles on 12; the bad variants drift.
 *
 * Variants:
 *   good          : on the response, set the count to the server's value (→ 12)
 *   no-reconcile   : keep the optimistic guess, ignore the response (→ 11)
 *   wrong-merge    : add the server value to the optimistic one (→ 23)
 *   revert-stale   : overwrite with a stale pre-action value (→ 10)
 */
export type OptimisticVariant = 'good' | 'no-reconcile' | 'wrong-merge' | 'revert-stale';

const API = 'http://localhost/api';
const START = 10;

function Counter({ variant }: { variant: OptimisticVariant }) {
  const [n, setN] = useState(START);

  const onLike = async () => {
    setN((prev) => prev + 1); // optimistic → 11
    const res = await fetch(`${API}/like`, { method: 'POST' });
    const data = (await res.json()) as { count: number };
    if (variant === 'good') setN(data.count); // reconcile to the server truth
    if (variant === 'wrong-merge') setN((prev) => prev + data.count); // 11 + 12
    if (variant === 'revert-stale') setN(START); // a stale refetch
    // no-reconcile: read the response but ignore it — keep the optimistic guess
  };

  return (
    <div>
      <span role="status">{n}</span>
      <button type="button" onClick={onLike}>
        Like
      </button>
    </div>
  );
}

export const buildOptimisticCounter = (variant: OptimisticVariant) => () => <Counter variant={variant} />;
