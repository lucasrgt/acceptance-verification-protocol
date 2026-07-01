import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './src/adapter-react/msw-server';

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
