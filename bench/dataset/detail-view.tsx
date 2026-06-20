import { useEffect, useState } from 'react';

/**
 * Faithful reproduction of the flash-of-id escape (projp ce04d0f / 33a0d5a): a
 * detail view fetches the entity, then chains a second query for the resolved
 * name; in the gap it paints the raw id (a GUID) before the name arrives.
 *
 * BAD : shows job.customerId until a second /customers/:id query resolves.
 * GOOD: the entity payload already carries customerName (one query) — no gap.
 */
const API = 'http://localhost/api';

interface Job {
  id: string;
  customerId: string;
  customerName?: string;
}

function JobDetail({ variant }: { variant: 'good' | 'bad' }) {
  const [job, setJob] = useState<Job | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void fetch(`${API}/jobs/1`)
      .then((r) => r.json() as Promise<Job>)
      .then((j) => {
        if (!alive) return;
        setJob(j);
        if (variant === 'good') {
          setName(j.customerName ?? null); // resolved in the same payload
        } else {
          void fetch(`${API}/customers/${j.customerId}`)
            .then((r) => r.json() as Promise<{ name: string }>)
            .then((c) => {
              if (alive) setName(c.name);
            });
        }
      });
    return () => {
      alive = false;
    };
  }, [variant]);

  if (!job) return <div>Loading…</div>;
  // BAD: fall back to the raw id while the name is still resolving.
  const label = name ?? (variant === 'bad' ? job.customerId : '…');
  return (
    <div>
      <h1>Job</h1>
      <p>Customer: {label}</p>
    </div>
  );
}

export const GoodJob = () => <JobDetail variant="good" />;
export const BadJob = () => <JobDetail variant="bad" />;
