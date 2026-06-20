import { useEffect, useState } from 'react';

/**
 * Faithful reproduction of two data-honesty escapes:
 *  - 8ec5dae5 / 74f546d1: a feed that falls back to FIXTURE rows when the live API
 *    returns nothing, shipping fake content as if it were real.
 *  - dfb23261: a missing cover image falls back to a STOCK photo (and missing
 *    avatars to a generated face) instead of a neutral placeholder.
 *
 * BAD : empty API -> fixtures; null cover -> stock photo.
 * GOOD: empty API -> empty state; null cover -> placeholder.
 */
const API = 'http://localhost/api';
const STOCK = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&w=900';

interface Listing {
  readonly id: string;
  readonly title: string;
  readonly coverUrl: string | null;
}

const FIXTURE: Listing[] = [
  { id: 'fx-1', title: 'Sunny Beach House', coverUrl: STOCK },
  { id: 'fx-2', title: 'Mountain Cabin', coverUrl: STOCK },
  { id: 'fx-3', title: 'City Loft', coverUrl: STOCK },
];

function Feed({ variant }: { variant: 'good' | 'bad' }) {
  const [items, setItems] = useState<Listing[] | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`${API}/listings`)
      .then((r) => r.json() as Promise<Listing[]>)
      .then((rows) => {
        if (!live) return;
        // BAD: invent fixture rows when the API is empty.
        if (variant === 'bad' && rows.length === 0) setItems(FIXTURE);
        else setItems(rows);
      });
    return () => {
      live = false;
    };
  }, [variant]);

  if (items === null) return <div>Loading…</div>;
  if (items.length === 0) return <div role="status">No listings yet.</div>;

  return (
    <ul>
      {items.map((it) => (
        <li key={it.id} role="article">
          {variant === 'bad' ? (
            // BAD: stock photo when there's no real cover.
            <img alt={it.title} src={it.coverUrl ?? STOCK} />
          ) : it.coverUrl ? (
            <img alt={it.title} src={it.coverUrl} />
          ) : (
            <div role="img" aria-label="no cover photo" />
          )}
          <span>{it.title}</span>
        </li>
      ))}
    </ul>
  );
}

export const GoodFeed = () => <Feed variant="good" />;
export const BadFeed = () => <Feed variant="bad" />;
