import { useEffect, useState } from 'react';

/**
 * Cross-screen projection pair (roadmap: observe the projection on a screen mounted AFTER
 * the mutation). A shared client-side store feeds two screens: screen A fires the mutation,
 * screen B renders the count. GOOD reads the LIVE store on mount; BAD renders a snapshot
 * frozen when the module loaded — the classic stale client-cache escape: screen A looks
 * right, the user navigates, screen B still shows the old world.
 */
const API = 'http://localhost/api';

// The shared source both screens read — a stand-in for a query cache / client store.
const store = { items: ['a', 'b', 'c'] };
// The stale snapshot the BAD screen holds on to (taken at module load, never refreshed).
const frozenAtLoad = [...store.items];

function ActionScreen() {
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    setBusy(true);
    const res = await fetch(`${API}/items/first`, { method: 'DELETE' });
    if (res.ok) store.items = store.items.slice(1); // the mutation updates the shared source
    setBusy(false);
  };
  return (
    <button onClick={remove} disabled={busy}>
      Remove first
    </button>
  );
}

function CountReadout({ read }: { read: () => readonly string[] }) {
  const [items, setItems] = useState<readonly string[]>([]);
  useEffect(() => {
    setItems(read()); // "load" from the shared source on mount
  }, [read]);
  return <p role="status" aria-label="remaining">{items.length} remaining</p>;
}

// Both mutation screens also show the count (the probe snapshots it BEFORE the action).
export const GoodMutationScreen = () => (
  <>
    <ActionScreen />
    <CountReadout read={() => store.items} />
  </>
);
export const GoodProjectionScreen = () => <CountReadout read={() => store.items} />;

export const BadMutationScreen = () => (
  <>
    <ActionScreen />
    <CountReadout read={() => frozenAtLoad} />
  </>
);
export const BadProjectionScreen = () => <CountReadout read={() => frozenAtLoad} />;

/** Reset the shared store between verifications (each drive mutates it). */
export function resetProjectionStore(): void {
  store.items = ['a', 'b', 'c'];
}
