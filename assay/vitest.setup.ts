import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './src/adapter-react/msw-server';
import { recordAccuracyMessage } from './bench/accuracy-record';

// BAD mutants crash on purpose; React then re-prints the error with framework advice
// ("The above error occurred in the <X> component…"). That duplicate advice is pure noise
// over an intentional signal — drop ONLY it; every other console.error stays untouched.
const realError = console.error.bind(console);
const realLog = console.log.bind(console);
console.log = (...args: unknown[]) => {
  for (const arg of args) if (typeof arg === 'string') recordAccuracyMessage(arg);
  realLog(...args);
};
console.error = (...args: unknown[]) => {
  const first = typeof args[0] === 'string' ? args[0] : '';
  if (first.includes('The above error occurred in')) return;
  // These exact exceptions are the deliberate crash mutants used to calibrate
  // render-resilience. Their verdict remains asserted; jsdom's duplicate report is noise.
  if (first.includes('data.title.trim is not a function')) return;
  if (first.includes("Cannot read properties of undefined (reading 'tags')")) return;
  realError(...args);
};

// jsdom declares scrollTo but throws "not implemented" when exercised. The browser-backed
// suites cover real scrolling; DOM-only benchmarks only need the harmless platform seam.
Object.defineProperty(window, 'scrollTo', {
  configurable: true,
  value: () => undefined,
});

const intentionalRenderMutants = [
  "Cannot read properties of null (reading 'name')",
  "Cannot read properties of undefined (reading 'map')",
  'data.title.trim is not a function',
  "Cannot read properties of undefined (reading 'tags')",
];
window.addEventListener('error', (event) => {
  if (intentionalRenderMutants.some((message) => event.message.includes(message))) {
    event.preventDefault();
  }
});

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
