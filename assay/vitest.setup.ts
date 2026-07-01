import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './src/adapter-react/msw-server';

// BAD mutants crash on purpose; React then re-prints the error with framework advice
// ("The above error occurred in the <X> component…"). That duplicate advice is pure noise
// over an intentional signal — drop ONLY it; every other console.error stays untouched.
const realError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const first = typeof args[0] === 'string' ? args[0] : '';
  if (first.includes('The above error occurred in')) return;
  realError(...args);
};

// The MSW server is the seam through which AVP forces network conditions
// (success / api-error / slow) and observes the effects an action produces.
// 'warn' (not 'bypass'): an endpoint the subject forgot to declare surfaces in the output
// instead of failing silently — unmocked traffic is exactly the signal a verifier wants.
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
