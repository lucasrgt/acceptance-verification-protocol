"use strict";

const fs = require("fs");
const path = require("path");

/**
 * eslint-plugin-assay — the STATIC half of the determinism story.
 *
 * Assay verifies behaviour at runtime, but only for features that HAVE a
 * verification. The gap "you never wrote one" is a static problem, so it belongs
 * in a static doctor (ADR 0001 keeps Assay runtime-only). This generic ESLint
 * plugin plugs the coverage check into any project's lint step; an AeroFortress Framework app
 * enables + configures it (mapping its slice/view types to archetypes).
 *
 * The rule keys off Assay's stable, statically-matchable convention:
 *   - verification files are co-located `*.assay.ts(x)` / `*.assay.js(x)`
 *   - they call `defineVerification(<archetype>, <subject>, <opts?>)` at top level
 * A feature "covers archetype A" iff a co-located verification calls
 * `defineVerification(A, …)`, where A is the archetype binding's identifier.
 *
 * It only claims "did you check?" — never "is the check complete?" (that is
 * runtime → Assay, and convergent → escape accrual).
 */

const ASSAY_FILE = /\.assay\.[jt]sx?$/;
const DEFINE_CALL = /defineVerification\s*\(\s*([A-Za-z_$][\w$]*)/g;

/**
 * Comments must not count as coverage: a commented-out defineVerification is exactly the
 * false green this rule exists to prevent. Strips /* *​/ blocks and // line tails (string
 * contents may be over-stripped in pathological cases — acceptable: identifiers inside
 * strings are not calls either). Known limit: a RENAMED import
 * (`import { defineVerification as dv }`) is not recognized — the convention is the
 * literal call name, and the rule checks the convention.
 */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

// Per-directory cache keyed by the assay files' names+mtimes — the rule runs once per
// LINTED FILE, and large repos have thousands; without this every linted file re-reads
// its whole directory.
const dirCache = new Map();

/** The archetype identifiers a co-located `*.assay.*` covers (the 1st arg of each defineVerification call). */
function coveredArchetypes(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return new Set(); // unreadable dir → nothing covered
  }
  const assayFiles = entries.filter((name) => ASSAY_FILE.test(name));

  const stamp = assayFiles
    .map((name) => {
      try {
        return `${name}:${fs.statSync(path.join(dir, name)).mtimeMs}`;
      } catch {
        return `${name}:?`;
      }
    })
    .join("|");
  const cached = dirCache.get(dir);
  if (cached && cached.stamp === stamp) return cached.covered;

  const covered = new Set();
  for (const name of assayFiles) {
    let src;
    try {
      src = stripComments(fs.readFileSync(path.join(dir, name), "utf8"));
    } catch {
      continue;
    }
    let m;
    DEFINE_CALL.lastIndex = 0;
    while ((m = DEFINE_CALL.exec(src))) covered.add(m[1]);
  }
  dirCache.set(dir, { stamp, covered });
  return covered;
}

/** Which of `required` archetype identifiers lack a co-located verification next to `filePath`. */
function missingArchetypes(filePath, required) {
  const covered = coveredArchetypes(path.dirname(filePath));
  return required.filter((a) => !covered.has(a));
}

/** Does the feature at `filePath` have ANY co-located Assay verification at all? */
function hasAnyVerification(filePath) {
  return coveredArchetypes(path.dirname(filePath)).size > 0;
}

/**
 * Minimal glob → RegExp anchored at the path's end (paths are absolute). SUPPORTED SUBSET
 * (documented, deliberate): `**​/` (any directories), `**` (anything), `*` (within a segment).
 * NOT supported: `?`, `{a,b}` braces, `[...]` classes — the coverage selectors this rule
 * takes are directory+suffix shapes, nothing more.
 */
function globToRegExp(glob) {
  const norm = glob.replace(/\\/g, "/");
  const body = norm
    .split(/(\*\*\/|\*\*|\*)/)
    .map((part) => {
      if (part === "**/") return "(?:.*/)?";
      if (part === "**") return ".*";
      if (part === "*") return "[^/]*";
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("");
  return new RegExp(body + "$");
}

function selectorMatches(glob, filePath) {
  return globToRegExp(glob).test(filePath.replace(/\\/g, "/"));
}

const requireVerification = {
  meta: {
    type: "problem",
    docs: {
      description: "require a co-located Assay verification covering each archetype a feature's type demands",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          coverage: {
            type: "array",
            items: {
              type: "object",
              properties: {
                files: { type: "string" },
                archetypes: { type: "array", items: { type: "string" } },
              },
              required: ["files", "archetypes"],
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missing: "{{file}} has no Assay verification for: {{archetypes}}. Add a co-located *.assay.* calling defineVerification({{archetypes}}, …).",
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const options = context.options[0] || {};
    const coverage = options.coverage || [];
    return {
      "Program:exit"(node) {
        for (const entry of coverage) {
          if (!selectorMatches(entry.files, filename)) continue;
          const missing = missingArchetypes(filename, entry.archetypes);
          if (missing.length > 0) {
            context.report({
              node,
              messageId: "missing",
              data: { file: path.basename(filename), archetypes: missing.join(", ") },
            });
          }
        }
      },
    };
  },
};

module.exports = {
  rules: { "require-verification": requireVerification },
  // exported for direct testing and read-only coverage scans
  coveredArchetypes,
  missingArchetypes,
  hasAnyVerification,
  selectorMatches,
};
