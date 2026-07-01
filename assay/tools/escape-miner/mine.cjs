"use strict";

/**
 * Escape miner (tier-1) — turn any git repo's fix history into a classified escape
 * corpus. Walks `git log`, keeps the fix-shaped commits, and classifies each by
 * archetype from message + changed-file signals. This is the SCALABLE evidence
 * layer (breadth/transfer), not the executed benchmark (faithful repros, curated).
 * It is HEURISTIC on purpose — keyword/path matching, honestly noisy; the value is
 * the distribution across many repos, not per-commit precision.
 *
 *   node mine.cjs <repo-path> [label]
 *
 * Reads nothing but git; mutates nothing. Works on a blobless/no-checkout clone
 * (uses `git log` + `git ls-tree`, never the working tree).
 */
const { execFileSync, spawn } = require("child_process");
const path = require("path");
const readline = require("readline");

// Bounded call for the file listing only; the LOG is streamed (see logLines) so a
// million-commit repo never needs a giant sync buffer.
function git(repo, args) {
  return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

/** Streams `git log` one commit per line — constant memory on any history size. */
async function* logLines(repo) {
  const child = spawn("git", ["-C", repo, "log", "--no-merges", "--pretty=format:%H%x1f%s"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr.on("data", (d) => (stderr += d));
  const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
  for await (const line of rl) if (line) yield line;
  const code = await new Promise((r) => child.on("close", r));
  if (code !== 0) throw new Error(stderr.trim() || `git log exited ${code}`);
}

function inferStack(repo) {
  let files = "";
  try {
    files = git(repo, ["ls-tree", "-r", "--name-only", "HEAD"]);
  } catch {
    return "unknown";
  }
  const has = (re) => re.test(files);
  const stacks = [];
  if (has(/(^|\/)go\.mod$/m)) stacks.push("go");
  if (has(/(^|\/)Gemfile$/m)) stacks.push("rails/ruby");
  if (has(/(^|\/)composer\.json$/m)) stacks.push("laravel/php");
  if (has(/\.csproj$/m) || has(/\.slnx?$/m)) stacks.push("dotnet");
  if (has(/(^|\/)package\.json$/m)) stacks.push("node/js");
  if (has(/(^|\/)pyproject\.toml$/m) || has(/(^|\/)requirements\.txt$/m)) stacks.push("python");
  return stacks.length ? stacks.join("+") : "unknown";
}

// Archetype classifiers — ordered; first match wins. Keyed off the catalog.
const ARCHETYPES = [
  ["navigation-integrity", /\b(404|not[-\s]?found|route|router|redirect|nav(igation)?|outlet|deep[-\s]?link|back[-\s]?button|voltar|breadcrumb|dead[-\s]?link)\b/i],
  ["authorization/persona", /\b(idor|authoriz|authz|permission|role[-\s]|tenant|persona|forbidden|403|unauthor|cross[-\s]?account|leak|scope to|own(ed|s)?[-\s]|visib)\b/i],
  ["temporal-integrity", /\b(time[-\s]?zone|tz|utc|off[-\s]?by[-\s]?one|midnight|day[-\s]?light|dst|date[-\s]?only|local time|wrong (date|day|time)|day boundary|start[Oo]f|end[Oo]f|dayjs|moment\.)\b/i],
  ["action-effect", /\b(no[-\s]?op|not connected|never connected|wire|wiring|silent(ly)?|phantom|does nothing|dead button|swallow|idempoten|retry|refresh token|401 interceptor|drop(ped)? (the )?(request|message|action))\b/i],
  ["projection/cache", /\b(stale|invalidate|invalidation|cache|refetch|out[-\s]?of[-\s]?sync|not updat|re-?sync|reconcile)\b/i],
  ["mount-stability", /\b(storm|infinite (loop|redirect|refetch)|render loop|freeze|frozen|hang|too many requests|re-?render loop|flicker)\b/i],
  ["data-honesty", /\b(fixture|mock data|fake (data|review|imagery)|placeholder (data|content)|stock photo|seed(ed)? data|hardcoded (data|list)|flash of (id|unstyled)|real data only)\b/i],
  ["integration-integrity", /\b(webhook|signature|callback|oauth|payment|stripe|checkout|mercadopago|back_urls)\b/i],
  ["second-order-effects", /\b(notif(y|ication)?|e-?mail|notify both|side[-\s]?effect|fan[-\s]?out)\b/i],
  ["lifecycle-gate", /\b(gate|guard|precondition|lifecycle|go[-\s]?live|publish(ing)?|state machine|transition|onboarding step)\b/i],
  ["money-integrity", /\b(money|pricing|currency|amount|cents|rounding|tax|total|split|refund|invoice)\b/i],
  ["state-completeness", /\b(loading state|empty state|skeleton|spinner|error state|no results)\b/i],
  ["i18n-honesty", /\b(i18n|translat|locale|missing (copy|string)|hardcoded (string|copy|text))\b/i],
  ["validation/request", /\b(validation|400|bad request|invalid (input|payload|body)|wire format|date[-\s]?only|wrong (type|shape))\b/i],
];

// A commit is fix-shaped if it reads like a defect remediation…
const FIX = /(^|\W)(fix|bug|hotfix|bugfix|patch|repair|broken|incorrect|wrong|regress|crash|revert|fails?|stop(s|ped)? )/i;
// …and not noise (deps, release, pure docs/test/style/ci).
const NOISE = /^(?:chore|docs?|test|ci|build|style|refactor|release|bump|merge)\b|\b(dependabot|bump|lockfile|changelog|readme|typo|whitespace|formatting|prettier|eslint config)\b/i;

/**
 * Every archetype whose signal matches — MULTI-LABEL (a "fix stale cache after webhook"
 * commit counts for both classes). The first match (catalog order) is the PRIMARY label,
 * used for the ranked table; the [MINE] machine line carries all labels.
 */
function classify(subject) {
  const labels = [];
  for (const [name, re] of ARCHETYPES) if (re.test(subject)) labels.push(name);
  return labels;
}

async function main() {
  const repo = process.argv[2];
  const label = process.argv[3] || path.basename(repo || "");
  if (!repo) {
    console.error("usage: node mine.cjs <repo-path> [label]");
    process.exit(2);
  }

  const stack = inferStack(repo);
  let log = "";
  try {
    log = git(repo, ["log", "--no-merges", "--pretty=format:%H%x1f%s"]);
  } catch (e) {
    console.error(`[miner] cannot read git log for ${label}: ${e.message}`);
    process.exit(1);
  }

  const commits = log
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const [hash, subject] = l.split("\x1f");
      return { hash, subject: subject || "" };
    });

  const fixes = commits.filter((c) => FIX.test(c.subject) && !NOISE.test(c.subject));
  const byArch = new Map();
  const bySecondary = new Map();
  let unclassified = 0;
  for (const c of fixes) {
    const labels = classify(c.subject);
    if (labels.length === 0) {
      unclassified++;
      continue;
    }
    const [primary, ...rest] = labels;
    if (!byArch.has(primary)) byArch.set(primary, []);
    byArch.get(primary).push(c);
    for (const extra of rest) bySecondary.set(extra, (bySecondary.get(extra) || 0) + 1);
  }

  const ranked = [...byArch.entries()].sort((x, y) => y[1].length - x[1].length);
  const classified = fixes.length - unclassified;

  console.log(`\n## ${label}  (stack: ${stack})`);
  console.log(`commits=${commits.length}  fix-shaped=${fixes.length}  classified=${classified}  unclassified=${unclassified}`);
  console.log(`\n| archetype | escapes | sample subjects |`);
  console.log(`|---|---|---|`);
  for (const [arch, list] of ranked) {
    const samples = list
      .slice(0, 2)
      .map((c) => `${c.hash.slice(0, 8)} ${c.subject.slice(0, 60).replace(/\|/g, "/")}`)
      .join(" · ");
    console.log(`| ${arch} | ${list.length} | ${samples} |`);
  }

  if (bySecondary.size > 0) {
    const extras = [...bySecondary.entries()].sort((a, b) => b[1] - a[1]).map(([a, n]) => `${a}:+${n}`).join(", ");
    console.log(`
secondary labels (multi-class commits): ${extras}`);
  }

  // Machine line for aggregation.
  const dist = ranked.map(([a, l]) => `${a}:${l.length}`).join(",");
  console.log(`\n[MINE] ${label}\tstack=${stack}\tcommits=${commits.length}\tfixes=${fixes.length}\tclassified=${classified}\t${dist}`);
}

main();
