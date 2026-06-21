import { useEffect, useRef, useState } from 'react';

/**
 * Faithful reproduction of the cache-across-identity escape (the marketplace's prior
 * account's rows feeding the new session): an app caches the current user's rows, and
 * on a sign-out / sign-in-as-another-account switch the cache feeds the PREVIOUS
 * identity's rows to the new session. The cache is per-mount (a useRef) so it
 * persists across the in-app switch but resets between runs — modelling a real query
 * cache surviving a logout. The class recurs as "invalidate sessions / clear cache"
 * fixes (documenso 8fca029d, d2976cb1).
 *
 * Signed in as A (rows: "Alice trip"); switch to B (rows: "Bob trip").
 *
 * Variants:
 *   good           : clears the cache on switch and refetches for B (shows Bob)
 *   stale-cache     : the cache key is a constant — B reads A's cached rows
 *   no-refetch      : loads only on mount — the switch never reloads (A's rows persist)
 *   stale-identity  : refetches, but with the mount-time identity — fetches A again
 */
export type IdentityVariant = 'good' | 'stale-cache' | 'no-refetch' | 'stale-identity';

const API = 'http://localhost/api';

interface Item {
  readonly id: string;
  readonly label: string;
}

function App({ variant }: { variant: IdentityVariant }) {
  const cache = useRef(new Map<string, Item[]>()).current;
  const mountUser = useRef('A').current; // the identity captured at mount (the stale-identity bug)
  const [user, setUser] = useState('A');
  const [items, setItems] = useState<Item[] | null>(null);

  const load = (current: string) => {
    const reqUser = variant === 'stale-identity' ? mountUser : current;
    const key = variant === 'stale-cache' ? 'items' : `items:${reqUser}`;
    const hit = cache.get(key);
    if (hit) {
      setItems(hit);
      return;
    }
    void fetch(`${API}/me/items`, { headers: { 'x-user': reqUser } })
      .then((r) => r.json() as Promise<Item[]>)
      .then((rows) => {
        cache.set(key, rows);
        setItems(rows);
      });
  };

  // no-refetch loads once (mount); the others reload when the user changes.
  const reloadKey = variant === 'no-refetch' ? 'once' : user;
  useEffect(() => {
    load(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const onSwitch = () => {
    if (variant === 'good') cache.clear(); // wipe the prior identity's cache on sign-out/sign-in
    setUser('B');
  };

  return (
    <div>
      <p>Signed in as {user}</p>
      <button type="button" onClick={onSwitch}>
        Switch account
      </button>
      {items === null ? (
        <span>Loading…</span>
      ) : (
        <ul>
          {items.map((i) => (
            <li key={i.id} role="article">
              {i.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const buildIdentityApp = (variant: IdentityVariant) => () => <App variant={variant} />;
