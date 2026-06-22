import { defineConfig } from "tsup";

// Five published entry points → the exports map in package.json. The core barrel (`.`) is dependency-free;
// the adapters are subpaths the consumer opts into (`@aerofortress/assay/react`, `/react/vitest`, `/http`,
// `/design`). tsup auto-externalizes everything in dependencies + peerDependencies, so the substrate libs
// (testing-library, msw) and the consumer's environment (react, vitest, jsdom, puppeteer-core, the Anthropic
// SDK the judge lazy-loads) are never bundled in.
export default defineConfig({
  entry: {
    index: "src/index.ts",
    react: "src/adapter-react/index.ts",
    "react/vitest": "src/adapter-react/vitest.ts",
    http: "src/adapter-http/index.ts",
    design: "src/adapter-design/verify.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  treeshake: true,
  sourcemap: true,
});
