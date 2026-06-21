import type { Verdict } from './types';

/** Human/agent-readable one-block summary of a verdict. Host-agnostic. */
export function formatVerdict(v: Verdict): string {
  const pct = Math.round(v.acceptanceScore * 100);
  const mark = (s: string) => (s === 'pass' ? '✓' : s === 'fail' ? '✗' : '–');
  const lines = v.results.map(
    (r) => `  ${mark(r.status)} ${r.criterionId} [${r.status}]${r.status === 'fail' ? ` — ${r.reason}` : ''}`,
  );
  return [`assay · ${v.subject} · ${v.archetype} — acceptance ${pct}%`, ...lines].join('\n');
}
