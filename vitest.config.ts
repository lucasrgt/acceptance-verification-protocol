import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Examples are their own packages with their own config (alias + react plugin).
    // eslint-plugin-assay is a plain-node CJS package with its own `node` self-test.
    exclude: [...configDefaults.exclude, 'examples/**', 'eslint-plugin-assay/**'],
  },
});
