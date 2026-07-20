import process from 'node:process';
import { URL } from 'node:url';

const entries = ['index.js', 'react.js', 'http.js'];

for (const entry of entries) {
  await import(new URL(`../dist/${entry}`, import.meta.url));
}

process.stdout.write(`package entrypoints load cleanly: ${entries.join(', ')}\n`);
