/**
 * Faithful reproduction of a real escape (source commit `615ed1a7`): a refund
 * button that was designed but never wired. Isolated pattern, not the real file.
 *
 * BAD : the button exists and renders, but the handler is a no-op (never wired).
 * GOOD: the button fires the real effect (the refund request).
 */
const API = 'http://localhost/api';

function Refund({ variant }: { variant: 'good' | 'bad' }) {
  async function refund() {
    if (variant === 'bad') return; // no-op: looks done, isn't wired
    await fetch(`${API}/refund`, { method: 'POST' });
  }
  return <button onClick={refund}>Refund</button>;
}

export const GoodRefund = () => <Refund variant="good" />;
export const BadRefund = () => <Refund variant="bad" />;
