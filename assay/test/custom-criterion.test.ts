import { describe, it, expect } from 'vitest';
import { archetype, criterion, mechanical, AvpFail, type Probe } from '../src/core/dsl';
import { runVerification, type VerifyHooks } from '../src/core/run';
import { verify } from '../src/adapter-react/verify';

/**
 * Off-catalog (custom) criterion — the extensibility escape hatch (ADR 0002).
 *
 * A domain rule no universal catalog archetype covers: in a multi-bank SaaS, every bank
 * integration must expose ONE canonical account protocol. This is a private business
 * invariant — not mineable from OSS, not part of the shipped catalog or its accuracy
 * benchmark — so the dev authors it in their own repo with the SAME public DSL the
 * catalog uses, and runs it through the SAME neutral executor. This file is both the
 * proof the seam works and the worked example the README points to.
 */

interface Account {
  readonly id: string;
  readonly currency: string;
  /** integer minor units (cents) — never a float */
  readonly balanceMinor: number;
}
interface BankProvider {
  readonly bank: string;
  readonly account: () => Account;
}
interface ConformanceSubject {
  readonly name: string;
  readonly providers: readonly BankProvider[];
}

/** The assertion vocabulary this off-catalog archetype speaks; the hooks below implement it. */
interface ProtocolExpect {
  everyProviderIsCanonical(): void;
}

// 1 — Author the criterion with the public DSL (reads like any catalog archetype).
const accountProtocol = archetype('account-protocol-conformance', '0.1.0', () => {
  criterion(
    'exposes-canonical-account-protocol',
    'Every bank provider returns the canonical account protocol: { id: string, currency: string, balanceMinor: integer }. No provider may drop a field, rename it, or report a fractional balance.',
    { substrate: 'http' },
    mechanical<ProtocolExpect>(async ({ act, expect }) => {
      await act();
      expect.everyProviderIsCanonical();
    }),
  );
});

// 2 — Bind it to a substrate by writing a Probe + VerifyHooks (the dev's own observation).
function protocolProbe(subject: ConformanceSubject): Probe<ProtocolExpect> {
  const offenders: string[] = [];
  return {
    async act() {
      for (const p of subject.providers) {
        const a = p.account() as Partial<Account>;
        const canonical =
          typeof a.id === 'string' &&
          typeof a.currency === 'string' &&
          typeof a.balanceMinor === 'number' &&
          Number.isInteger(a.balanceMinor);
        if (!canonical) offenders.push(p.bank);
      }
    },
    expect: {
      everyProviderIsCanonical() {
        if (offenders.length) {
          throw new AvpFail(
            `These bank providers break the canonical account protocol: ${offenders.join(', ')}. Each must return { id: string, currency: string, balanceMinor: integer }.`,
            { offenders },
          );
        }
      },
    },
  };
}
const protocolHooks = (subject: ConformanceSubject): VerifyHooks => ({ probe: () => protocolProbe(subject) });

// 3 — Two calibration subjects: a compliant fleet, and one with a bank off-protocol.
const compliant: readonly BankProvider[] = [
  { bank: 'acme', account: () => ({ id: 'a1', currency: 'BRL', balanceMinor: 1000 }) },
  { bank: 'globex', account: () => ({ id: 'g1', currency: 'BRL', balanceMinor: 2500 }) },
];
const good: ConformanceSubject = { name: 'all-banks-compliant', providers: compliant };
const bad: ConformanceSubject = {
  name: 'one-bank-off-protocol',
  // initech reports a fractional balance (float currency units) instead of integer minor units.
  providers: [...compliant, { bank: 'initech', account: () => ({ id: 'i1', currency: 'BRL', balanceMinor: 12.5 }) }],
};

const statusOf = (v: Awaited<ReturnType<typeof runVerification>>) =>
  v.results.find((r) => r.criterionId === 'exposes-canonical-account-protocol');

describe('off-catalog (custom) criterion — extensibility escape hatch (ADR 0002)', () => {
  it('runs through the neutral core executor (runVerification) and passes a compliant fleet', async () => {
    const v = await runVerification(good.name, accountProtocol, protocolHooks(good));
    expect(statusOf(v)?.status, statusOf(v)?.reason).toBe('pass');
    expect(v.acceptanceScore).toBe(1);
  });

  it('catches a bank that breaks the protocol (caos → verde) with an actionable reason', async () => {
    const v = await runVerification(bad.name, accountProtocol, protocolHooks(bad));
    const target = statusOf(v);
    expect(target?.status).toBe('fail');
    expect(target?.reason).toContain('initech');
  });

  it('runs on the React convenience entry via verify(..., { hooks }) — no global registration', async () => {
    const pass = await verify(accountProtocol, good, { hooks: (s) => protocolHooks(s as ConformanceSubject) });
    expect(statusOf(pass)?.status).toBe('pass');

    const fail = await verify(accountProtocol, bad, { hooks: (s) => protocolHooks(s as ConformanceSubject) });
    expect(statusOf(fail)?.status).toBe('fail');
  });
});
