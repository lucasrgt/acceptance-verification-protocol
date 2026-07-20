"use strict";

// Self-test for eslint-plugin-assay. The rule's substance is filesystem logic
// (is there a co-located *.assay.test.* covering archetype A?), so we test that core
// directly against real temp fixtures — no ESLint runtime needed. Run:
// `node index.test.cjs` (exits non-zero on any failing case).

const fs = require("fs");
const os = require("os");
const path = require("path");
const assert = require("assert");
const { missingArchetypes, hasAnyVerification, selectorMatches } = require("./index.cjs");

let failures = 0;
function test(name, fn) {
  try {
    fn();
    // eslint-disable-next-line no-console
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures++;
    // eslint-disable-next-line no-console
    console.log(`  ✗ ${name}\n    ${e.message}`);
  }
}

// Build a throwaway feature directory.
const root = fs.mkdtempSync(path.join(os.tmpdir(), "assay-rule-"));
const featureDir = path.join(root, "src", "checkout");
fs.mkdirSync(featureDir, { recursive: true });
const viewFile = path.join(featureDir, "Pay.view.tsx");
fs.writeFileSync(viewFile, "export const Pay = () => null;\n");

test("missing: a view with no *.assay.test.* is uncovered for every required archetype", () => {
  assert.deepStrictEqual(missingArchetypes(viewFile, ["actionEffect", "payment"]), ["actionEffect", "payment"]);
});

test("hasAnyVerification is false before any verification exists", () => {
  assert.strictEqual(hasAnyVerification(viewFile), false);
});

// The old suffix contains ".assay." but Vitest does not discover it by default; accepting it would be a
// static green for a proof that `assay verify` never executes.
fs.writeFileSync(path.join(featureDir, "Pay.assay.tsx"), "defineVerification(actionEffect, paySubject);\n");
test("a non-Vitest-discoverable *.assay.tsx file is not proof", () => {
  assert.strictEqual(hasAnyVerification(viewFile), false);
});

// Add a partial verification (covers actionEffect only).
fs.writeFileSync(
  path.join(featureDir, "Pay.assay.test.tsx"),
  `import { defineVerification } from "assay/react/vitest";
import { actionEffect } from "assay";
defineVerification(actionEffect, paySubject);
`,
);

test("partial coverage: payment still missing, actionEffect now covered", () => {
  assert.deepStrictEqual(missingArchetypes(viewFile, ["actionEffect", "payment"]), ["payment"]);
});

test("hasAnyVerification is true once a verification exists", () => {
  assert.strictEqual(hasAnyVerification(viewFile), true);
});

// Add the second archetype (multiple defineVerification calls / files compose).
fs.writeFileSync(
  path.join(featureDir, "Pay.payment.assay.test.tsx"),
  `defineVerification( payment , paySubject)\n`,
);

test("full coverage: nothing missing once every archetype has a defineVerification", () => {
  assert.deepStrictEqual(missingArchetypes(viewFile, ["actionEffect", "payment"]), []);
});

test("selectorMatches: a **/ glob matches an absolute view path", () => {
  assert.strictEqual(selectorMatches("src/**/*.view.tsx", viewFile), true);
  assert.strictEqual(selectorMatches("src/**/*.view.tsx", path.join(featureDir, "Pay.viewModel.ts")), false);
  assert.strictEqual(selectorMatches("src/**/checkout/**", viewFile), true);
});

fs.rmSync(root, { recursive: true, force: true });

if (failures > 0) {
  // eslint-disable-next-line no-console
  console.error(`\n${failures} failing case(s).`);
  process.exit(1);
}
// eslint-disable-next-line no-console
console.log("\neslint-plugin-assay: all green.");
