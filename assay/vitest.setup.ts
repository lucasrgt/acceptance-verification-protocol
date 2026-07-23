import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './src/adapter-react/msw-server';
import { recordAccuracyMessage } from './bench/accuracy-record';

// React 18 requires test runners to declare that state transitions are observed
// through act(). Testing Library owns the act boundaries used by these benchmarks.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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
// Dataset benchmarks also exercise real loopback servers; those requests deliberately bypass
// MSW. Any other endpoint the subject forgot to declare remains visible as a warning.
beforeAll(() =>
  server.listen({
    onUnhandledRequest(request, print) {
      const hostname = new URL(request.url).hostname;
      if (hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1') return;
      print.warning();
    },
  }),
);
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
