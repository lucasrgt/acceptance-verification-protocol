import { useEffect, useState } from 'react';

/**
 * Faithful reproduction of the anonymous-boot refetch storm — near-identical in
 * two projects (commits e6c81abe and projp:626c8ce): a guard/effect re-fires the
 * session query on every settle, so a cold anonymous mount storms `/me` and the
 * boot splash never resolves.
 *
 * BAD : each settle re-arms the fetch (a stand-in for the guard→remount→refetch
 *       loop), storming the endpoint.
 * GOOD: fetches once and settles.
 */
const API = 'http://localhost/api';

function Boot({ variant }: { variant: 'good' | 'bad' }) {
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetch(`${API}/me`).then(() => {
      if (!alive) return;
      // BAD: bumping `tick` re-runs this effect → another fetch → … (bounded so the test can't hang).
      if (variant === 'bad' && tick < 12) setTick((t) => t + 1);
      else setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [tick, variant]);

  return <div role="status">{ready ? 'Home' : 'Loading…'}</div>;
}

export const GoodBoot = () => <Boot variant="good" />;
export const BadBoot = () => <Boot variant="bad" />;
