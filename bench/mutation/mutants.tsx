import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

/**
 * Mutant families — each takes a fault flavour and injects ONE way a criterion's
 * failure class can show up. `none` is the healthy (benign) variant; the rest are
 * mutants a robust criterion must KILL. This is the verifier's adversarial test
 * set: not one bad example per criterion, but a family of them. Each factory
 * returns a render thunk (`() => <Screen/>`) so the component mounts through React.
 */
const API = 'http://localhost/api';

// --- action-effect: fires-primary-effect (no-op flavours) ---
export type ActionFault = 'none' | 'no-handler' | 'inert-handler' | 'prevent-only';
export function actionMutant(fault: ActionFault): () => ReactElement {
  const Screen = () => {
    const onClick = async (e: React.MouseEvent) => {
      if (fault === 'prevent-only') {
        e.preventDefault();
        return; // looks wired, does nothing
      }
      if (fault === 'inert-handler') {
        return; // a handler that never reaches the network
      }
      await fetch(`${API}/widgets`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
    };
    return (
      <button type="button" onClick={fault === 'no-handler' ? undefined : onClick}>
        Save
      </button>
    );
  };
  return () => <Screen />;
}

// --- data-honesty: no-fixture-fallback (fixture-injection flavours) ---
export type FeedFault = 'none' | 'array-fixture' | 'single-fixture';
const FIXTURE = [{ id: 'fx-1' }, { id: 'fx-2' }, { id: 'fx-3' }];
export function feedMutant(fault: FeedFault): () => ReactElement {
  const Feed = () => {
    const [items, setItems] = useState<{ id: string }[] | null>(null);
    useEffect(() => {
      let alive = true;
      void fetch(`${API}/things`)
        .then((r) => r.json() as Promise<{ id: string }[]>)
        .then((rows) => {
          if (!alive) return;
          if (fault === 'array-fixture' && rows.length === 0) setItems(FIXTURE);
          else if (fault === 'single-fixture' && rows.length === 0) setItems([{ id: 'fx-1' }]);
          else setItems(rows);
        });
      return () => {
        alive = false;
      };
    }, []);
    if (items === null) return <div>Loading…</div>;
    if (items.length === 0) return <div role="status">No things yet.</div>;
    return (
      <ul>
        {items.map((i) => (
          <li key={i.id} role="article">
            {i.id}
          </li>
        ))}
      </ul>
    );
  };
  return () => <Feed />;
}

// --- data-honesty: no-fabricated-media (stock-source flavours) ---
// The fabricated source can be ANY remote host, not just the ones on a markers list.
export type MediaFault = 'placeholder' | 'unsplash' | 'other-stock' | 'pravatar';
const STOCK: Record<Exclude<MediaFault, 'placeholder'>, string> = {
  unsplash: 'https://images.unsplash.com/photo-1500530855697',
  'other-stock': 'https://cdn.somestocksite.io/beach.jpg',
  pravatar: 'https://i.pravatar.cc/120?u=1',
};
export function mediaMutant(fault: MediaFault): () => ReactElement {
  const Feed = () => {
    const [items, setItems] = useState<{ id: string; cover: string | null }[] | null>(null);
    useEffect(() => {
      let alive = true;
      void fetch(`${API}/things`)
        .then((r) => r.json() as Promise<{ id: string; cover: string | null }[]>)
        .then((rows) => {
          if (alive) setItems(rows);
        });
      return () => {
        alive = false;
      };
    }, []);
    if (items === null) return <div>Loading…</div>;
    return (
      <ul>
        {items.map((it) => (
          <li key={it.id} role="article">
            {it.cover ? (
              <img alt={it.id} src={it.cover} />
            ) : fault === 'placeholder' ? (
              <div role="img" aria-label="no cover" />
            ) : (
              <img alt={it.id} src={STOCK[fault]} />
            )}
          </li>
        ))}
      </ul>
    );
  };
  return () => <Feed />;
}

// --- action-effect: no-phantom-success (failure-honesty flavours) ---
export type PhantomFault = 'honest' | 'draft-cleared' | 'no-error' | 'false-success';
export function phantomMutant(fault: PhantomFault): () => ReactElement {
  const Screen = () => {
    const [draft, setDraft] = useState('');
    const [err, setErr] = useState(false);
    const [ok, setOk] = useState(false);
    const onSubmit = async () => {
      setErr(false);
      setOk(false);
      const res = await fetch(`${API}/widgets`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ v: draft }),
      });
      if (!res.ok) {
        if (fault === 'draft-cleared') setDraft('');
        if (fault !== 'no-error') setErr(true);
        if (fault === 'false-success') setOk(true); // phantom: claims saved on failure
        return;
      }
      setDraft('');
      setOk(true);
    };
    return (
      <div>
        <input aria-label="note" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="button" onClick={onSubmit}>
          Save
        </button>
        {err && <div role="alert">Could not save — try again.</div>}
        {ok && <p>Saved!</p>}
      </div>
    );
  };
  return () => <Screen />;
}

// --- navigation-integrity: target-resolves (dead-route flavours) ---
export function navMutant(target: string): (navigate: (p: string) => void) => ReactElement {
  return (navigate) => (
    <button type="button" onClick={() => navigate(target)}>
      Go
    </button>
  );
}

// --- mount-stability: settles-without-storm ---
export type StormFault = 'calm' | 'storm';
export function stormMutant(fault: StormFault): () => ReactElement {
  const Boot = () => {
    const [tick, setTick] = useState(0);
    const [ready, setReady] = useState(false);
    useEffect(() => {
      let alive = true;
      void fetch(`${API}/me`).then(() => {
        if (!alive) return;
        if (fault === 'storm' && tick < 12) setTick((t) => t + 1);
        else setReady(true);
      });
      return () => {
        alive = false;
      };
    }, [tick]);
    return <div role="status">{ready ? 'Home' : 'Loading…'}</div>;
  };
  return () => <Boot />;
}

// --- persona-scoped-visibility: no-cross-persona-affordance (cross-ROLE flavours) ---
// The leak can render as a button, a link, or a tab. A robust criterion must catch
// the affordance by what it IS (a "switch to host" control), not only by one role.
export type PersonaFault = 'none' | 'button' | 'link' | 'tab';
export function personaMutant(fault: PersonaFault): () => ReactElement {
  const Settings = () => (
    <div>
      <button type="button">Account</button>
      {fault === 'button' && <button type="button">Switch to host</button>}
      {fault === 'link' && <a href="/host">Switch to host</a>}
      {fault === 'tab' && (
        <div role="tab" tabIndex={0}>
          Switch to host
        </div>
      )}
    </div>
  );
  return () => <Settings />;
}
