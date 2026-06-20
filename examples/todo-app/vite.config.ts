import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Resolve `avp` / `avp/react` to the library source (unpublished). One config
// serves both `vite` (dev) and `vitest` (the AVP verification).
export default defineConfig({
  plugins: [react()],
  resolve: {
    // The aliased AVP source lives outside this package; force a single React
    // copy so hooks share one dispatcher (avoids the dual-package hazard).
    dedupe: ['react', 'react-dom'],
    alias: [
      { find: /^assay\/react\/vitest$/, replacement: resolve(import.meta.dirname, '../../src/adapter-react/vitest.ts') },
      { find: /^assay\/react$/, replacement: resolve(import.meta.dirname, '../../src/adapter-react/index.ts') },
      { find: /^assay$/, replacement: resolve(import.meta.dirname, '../../src/index.ts') },
    ],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
