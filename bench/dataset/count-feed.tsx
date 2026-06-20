import { useEffect, useState } from 'react';

/**
 * Faithful reproduction of the count-mismatch escape (documenso b8e08e88 "api keys
 * not showing"; 5f4e0ccf count vs source): the API returns N rows but the list
 * renders a different number — a client-side filter silently DROPS rows, or a
 * fixture/featured merge INVENTS them. The rendered count stops tracing to the
 * source.
 *
 * GOOD: render exactly the rows the API returned.
 * Variants drop or invent:
 *   drop-filter     : a hardcoded allowlist drops rows whose category isn't in it
 *   inject-featured  : prepends a fixture "featured" row
 *   pad-to-min       : pads with fixtures up to a minimum of 4
 *   dedup-bug        : a de-dup keyed on a non-unique field collapses distinct rows
 */
export type CountVariant = 'good' | 'drop-filter' | 'inject-featured' | 'pad-to-min' | 'dedup-bug';

const API = 'http://localhost/api';
const ALLOW = new Set(['a']); // a stale client-side whitelist
const FEATURED: Row = { id: 'fx-featured', category: 'promo' };

export interface Row {
  readonly id: string;
  readonly category: string;
}

function transform(variant: CountVariant, rows: Row[]): Row[] {
  switch (variant) {
    case 'good':
      return rows;
    case 'drop-filter':
      return rows.filter((r) => ALLOW.has(r.category));
    case 'inject-featured':
      return [FEATURED, ...rows];
    case 'pad-to-min': {
      const out = [...rows];
      let i = 0;
      while (out.length < 4) out.push({ id: `pad-${i++}`, category: 'pad' });
      return out;
    }
    case 'dedup-bug': {
      const byCategory = new Map<string, Row>();
      for (const r of rows) if (!byCategory.has(r.category)) byCategory.set(r.category, r);
      return [...byCategory.values()];
    }
  }
}

function CountFeed({ variant }: { variant: CountVariant }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`${API}/items`)
      .then((r) => r.json() as Promise<Row[]>)
      .then((data) => {
        if (live) setRows(transform(variant, data));
      });
    return () => {
      live = false;
    };
  }, [variant]);

  if (rows === null) return <div>Loading…</div>;
  if (rows.length === 0) return <div role="status">No items yet.</div>;
  return (
    <ul>
      {rows.map((r) => (
        <li key={r.id} role="article">
          {r.id}
        </li>
      ))}
    </ul>
  );
}

export const buildCountFeed = (variant: CountVariant) => () => <CountFeed variant={variant} />;
