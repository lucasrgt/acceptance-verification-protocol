import { useState, useSyncExternalStore } from 'react';

/**
 * Faithful reproduction of stale-projection escapes (source commits b9659b46,
 * 5a0f2acb): a mutation updates the shared data but a sibling projection (a
 * count/badge reading the same source) is not invalidated, so it stays stale.
 *
 * BAD : the mutation updates the shared source but never notifies subscribers.
 * GOOD: it notifies, so the projection re-reads and reflects the change.
 */
const API = 'http://localhost/api';
const initial = ['Alpha', 'Bravo', 'Charlie'];
let items = [...initial];
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function snapshot() {
  return items;
}

async function removeFirst(variant: 'good' | 'bad') {
  await fetch(`${API}/items/${items[0]}`, { method: 'DELETE' });
  items = items.slice(1); // shared source updated
  if (variant === 'good') listeners.forEach((l) => l()); // invalidate → projection re-reads
  // bad: subscribers are never notified → the projection stays stale
}

function Dashboard({ variant }: { variant: 'good' | 'bad' }) {
  // reset the shared source on mount (before the store is read) to isolate runs
  useState(() => {
    items = [...initial];
    return null;
  });
  const live = useSyncExternalStore(subscribe, snapshot);
  return (
    <div>
      <div role="status" aria-label="remaining">
        {live.length} remaining
      </div>
      <button onClick={() => removeFirst(variant)}>Remove first</button>
    </div>
  );
}

export const GoodDashboard = () => <Dashboard variant="good" />;
export const BadDashboard = () => <Dashboard variant="bad" />;
