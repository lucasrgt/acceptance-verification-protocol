import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// The example imports the PUBLISHED name (`@aerofortress/assay`, exactly what a consumer
// copies), aliased here to the library source since this workspace verifies the unpublished
// tree. One config serves both `vite` (dev) and `vitest` (the AVP verification).
export default defineConfig({
  plugins: [react()],
  resolve: {
    // The aliased source lives outside this package; force a single React copy so hooks
    // share one dispatcher (avoids the dual-package hazard).
    dedupe: ['react', 'react-dom'],
    alias: [
      { find: /^@aerofortress\/assay\/react\/vitest$/, replacement: resolve(import.meta.dirname, '../../src/adapter-react/vitest.ts') },
      { find: /^@aerofortress\/assay\/react$/, replacement: resolve(import.meta.dirname, '../../src/adapter-react/index.ts') },
      { find: /^@aerofortress\/assay$/, replacement: resolve(import.meta.dirname, '../../src/index.ts') },
    ],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
