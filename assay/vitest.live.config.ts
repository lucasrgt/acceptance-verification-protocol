import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['bench/**/*.live.test.ts'],
    maxWorkers: 1,
    hookTimeout: 30_000,
  },
});
