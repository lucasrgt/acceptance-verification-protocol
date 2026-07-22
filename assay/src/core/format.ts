import type { Verdict } from './types';

/** Human/agent-readable one-block summary of a verdict. Host-agnostic. */
export function formatVerdict(v: Verdict): string {
  const score = v.acceptanceScore === null ? 'n/a' : `${Math.round(v.acceptanceScore * 100)}%`;
  const mark = (s: string) => (s === 'pass' ? '✓' : s === 'fail' ? '✗' : s === 'unresolved' ? '?' : '–');
  const lines = v.results.map(
    (r) => `  ${mark(r.status)} ${r.criterionId} [${r.status}]${r.status !== 'pass' ? ` — ${r.reason}` : ''}`,
  );
  const detail = v.applicable === 0
    ? '0 applicable — nothing was decided'
    : `${v.passed}/${v.applicable}; unresolved=${v.unresolved}`;
  const header = `assay · ${v.subject} · ${v.archetype} — ${v.outcome} · acceptance ${score} (${detail})`;
  return [header, ...lines].join('\n');
}

/**
 * The canonical machine form of a verdict: one NDJSON line, key order fixed by the
 * Verdict type. This is what CI artifacts and agent loops should persist/parse —
 * `formatVerdict` is the human face, this is the wire face.
 */
export function verdictToJsonLine(v: Verdict): string {
  return JSON.stringify(v);
}
