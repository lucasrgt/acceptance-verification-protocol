import { useState, type FormEvent } from 'react';
import { describe, expect, it } from 'vitest';
import { actionEffect } from '../src/archetypes/action-effect';
import type { ActionEffectSubject } from '../src/adapter-react/subject';
import { verify } from '../src/adapter-react/verify';

const ENDPOINT = 'http://localhost/api/deposit';

function DepositForm() {
  const [wallet, setWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [failed, setFailed] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ wallet, amount: Number(amount) }),
    });
    setFailed(!response.ok);
  }

  return (
    <form onSubmit={(event) => void submit(event)}>
      <label htmlFor="wallet">Wallet</label>
      <input id="wallet" value={wallet} onChange={(event) => setWallet(event.target.value)} />
      <label htmlFor="amount">Amount</label>
      <input id="amount" value={amount} onChange={(event) => setAmount(event.target.value)} />
      {failed ? <p role="alert">Deposit failed. Try again.</p> : null}
      <button type="submit">Deposit</button>
    </form>
  );
}

const subject: ActionEffectSubject = {
  name: 'multi-input deposit',
  render: () => <DepositForm />,
  endpoint: { method: 'POST', path: ENDPOINT },
  action: { role: 'button', name: /deposit/i },
  inputs: [
    { role: 'textbox', name: /wallet/i, value: '11111111-1111-4111-8111-111111111111' },
    { role: 'textbox', name: /amount/i, value: '50' },
  ],
};

describe('action-effect multi-input subjects', () => {
  it('fills the complete form and preserves every draft when the action fails', async () => {
    const verdict = await verify(actionEffect, subject);
    const target = verdict.results.find((result) => result.criterionId === 'no-phantom-success');

    expect(target?.status, target?.reason).toBe('pass');
    expect(verdict.results.find((result) => result.criterionId === 'fires-primary-effect')?.status).toBe('pass');
  });
});
