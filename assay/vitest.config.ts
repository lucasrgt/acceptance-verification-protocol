import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Geometry benchmarks launch real Chromium processes. Bounding worker concurrency and
    // allowing teardown enough time keeps the scientific gate deterministic on smaller CI hosts.
    maxWorkers: 4,
    hookTimeout: 30_000,
    // Examples are their own packages with their own config (alias + react plugin).
    // eslint-plugin-assay is a plain-node CJS package with its own `node` self-test.
    exclude: [...configDefaults.exclude, 'examples/**', 'eslint-plugin-assay/**'],
  },
});
