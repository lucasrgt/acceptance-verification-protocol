import { useRef, useState } from 'react';

/**
 * Faithful reproductions of three action-effect tail escapes.
 *
 *  - request-accepted (c1849234): onboarding sent birthDate as a full ISO datetime
 *    to a date-only backend field → 400 before any validation ran. BAD sends a
 *    datetime; GOOD sends the date-only wire shape.
 *
 *  - idempotent-retry (0188869f): a create→…→publish chain re-ran create on retry,
 *    leaking a duplicate draft per attempt. BAD re-POSTs create on every click;
 *    GOOD holds the minted id and skips create on retry.
 *
 *  - survives-token-refresh (b4b0fc07): an idle tab's expired token 401'd and the
 *    action just errored. BAD errors on 401; GOOD refreshes and replays.
 */
const API = 'http://localhost/api';

// --- request-accepted (both variants handle failure honestly; only the wire shape differs) ---
function OnboardingForm({ variant }: { variant: 'good' | 'bad' }) {
  const [value, setValue] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  async function submit() {
    setError(false);
    // BAD: a Date -> ISO datetime string, sent to a date-only field.
    const birthDate = variant === 'bad' ? new Date(value).toISOString() : value;
    const res = await fetch(`${API}/onboarding`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ birthDate }),
    });
    if (!res.ok) {
      setError(true); // keep the draft, surface the error
      return;
    }
    setDone(true);
  }
  return (
    <div>
      <input aria-label="birth date" value={value} onChange={(e) => setValue(e.target.value)} />
      <button type="button" onClick={submit}>
        Save
      </button>
      {error && <div role="alert">Could not save — check the form and try again.</div>}
      {done && <p>Saved.</p>}
    </div>
  );
}
export const GoodOnboarding = () => <OnboardingForm variant="good" />;
export const BadOnboarding = () => <OnboardingForm variant="bad" />;

// --- idempotent-retry ---
function CreateWizard({ variant }: { variant: 'good' | 'bad' }) {
  const idRef = useRef<string | null>(null);
  async function create() {
    // GOOD: a retry resumes from the already-minted id instead of re-creating.
    if (variant === 'good' && idRef.current) return;
    const res = await fetch(`${API}/services`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Cleaning' }),
    });
    const data = (await res.json()) as { id?: string };
    idRef.current = data.id ?? 'created';
  }
  return (
    <div>
      <button type="button" onClick={create}>
        Create
      </button>
    </div>
  );
}
export const GoodWizard = () => <CreateWizard variant="good" />;
export const BadWizard = () => <CreateWizard variant="bad" />;

// --- survives-token-refresh ---
function ChargeAction({ variant }: { variant: 'good' | 'bad' }) {
  const [err, setErr] = useState(false);
  const [ok, setOk] = useState(false);
  async function charge() {
    setErr(false);
    let res = await fetch(`${API}/charge`, { method: 'POST' });
    if (res.status === 401) {
      if (variant === 'bad') {
        setErr(true); // BAD: surface an error, never recover.
        return;
      }
      await fetch(`${API}/auth/refresh`, { method: 'POST' }); // GOOD: refresh…
      res = await fetch(`${API}/charge`, { method: 'POST' }); // …and replay.
    }
    if (res.ok) setOk(true);
  }
  return (
    <div>
      <button type="button" onClick={charge}>
        Charge
      </button>
      {err && <div role="alert">Session expired.</div>}
      {ok && <p>Charged.</p>}
    </div>
  );
}
export const GoodCharge = () => <ChargeAction variant="good" />;
export const BadCharge = () => <ChargeAction variant="bad" />;
