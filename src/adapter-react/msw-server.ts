import { setupServer } from 'msw/node';

/** Shared MSW server. Checks call `server.use(...)` to force each condition. */
export const server = setupServer();
