"use strict";

// Read-only coverage scan — dogfood the require-verification rule against a real
// project WITHOUT modifying it. Walks a directory for `*.view.tsx` features and
// reports how many have a co-located Assay verification.
//
//   node scan.cjs <project-dir> [viewGlobSuffix=.view.tsx]
//
// It mutates nothing; it only counts. This is how we measure the static coverage
// gap a real app would have the day it adopts the rule.

const fs = require("fs");
const path = require("path");
const { hasAnyVerification } = require("./index.cjs");

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".turbo", "client.gen", ".codegraph"]);

function walk(dir, suffix, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(full, suffix, out);
    } else if (e.name.endsWith(suffix)) {
      out.push(full);
    }
  }
}

const target = process.argv[2];
const suffix = process.argv[3] || ".view.tsx";
if (!target) {
  // eslint-disable-next-line no-console
  console.error("usage: node scan.cjs <project-dir> [suffix=.view.tsx]");
  process.exit(2);
}

const views = [];
walk(path.resolve(target), suffix, views);
const covered = views.filter((v) => hasAnyVerification(v));
const uncovered = views.filter((v) => !hasAnyVerification(v));

// eslint-disable-next-line no-console
console.log(`\n[assay coverage] ${path.basename(target)} — ${suffix} features`);
// eslint-disable-next-line no-console
console.log(`  total:     ${views.length}`);
// eslint-disable-next-line no-console
console.log(`  covered:   ${covered.length}  (have a co-located *.assay.*)`);
// eslint-disable-next-line no-console
console.log(`  uncovered: ${uncovered.length}`);
for (const v of uncovered.slice(0, 12)) {
  // eslint-disable-next-line no-console
  console.log(`    - ${path.relative(target, v)}`);
}
if (uncovered.length > 12) {
  // eslint-disable-next-line no-console
  console.log(`    … and ${uncovered.length - 12} more`);
}
