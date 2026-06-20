import { useState } from 'react';

/**
 * Faithful reproduction of a real escape (source commit `04677bf9`): a chat
 * message composer that silently dropped a failed send. NOT the verbatim source
 * file (which doesn't run standalone) — the same bug pattern, isolated.
 *
 * BAD : clears the draft optimistically BEFORE knowing it worked and swallows
 *       the error → phantom success.
 * GOOD: clears only on the success path; on failure keeps the draft and shows an error.
 */
const API = 'http://localhost/api';

function Composer({ variant }: { variant: 'good' | 'bad' }) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const text = draft;
    if (variant === 'bad') {
      setDraft(''); // cleared before knowing the outcome
      try {
        await fetch(`${API}/messages`, { method: 'POST', body: JSON.stringify({ text }) });
      } catch {
        // error swallowed
      }
      return;
    }
    setError(null);
    try {
      const r = await fetch(`${API}/messages`, { method: 'POST', body: JSON.stringify({ text }) });
      if (!r.ok) throw new Error(`http ${r.status}`);
      setDraft(''); // only clear on success
    } catch {
      setError('Failed to send. Please try again.');
    }
  }

  return (
    <div>
      <textarea aria-label="message" value={draft} onChange={(e) => setDraft(e.target.value)} />
      {error && <div role="alert">{error}</div>}
      <button onClick={send}>Send</button>
    </div>
  );
}

export const GoodComposer = () => <Composer variant="good" />;
export const BadComposer = () => <Composer variant="bad" />;
