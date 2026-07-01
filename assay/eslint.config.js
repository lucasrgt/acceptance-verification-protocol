import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Minimal, honest lint for a verification library: correctness rules on, style left to
// .editorconfig. `any` is banned except where a file explicitly justifies the seam.
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', 'examples/**', 'eslint-plugin-assay/**', 'tools/**', 'bin/**'],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Bench/test files talk to the console on purpose (the accuracy numbers).
    files: ['bench/**', 'test/**', 'vitest.setup.ts'],
    rules: { 'no-console': 'off' },
  },
);
