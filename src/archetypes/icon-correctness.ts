import { archetype, criterion, model } from '../core/dsl';

/**
 * The `icon-correctness` archetype — the design catalog's MODEL-oracle criterion (the last
 * non-mechanical one). composition-canonical already checks that an icon is PRESENT and is
 * the canonical DS component; this checks the icon's MEANING fits its control — a back
 * affordance shows a left-chevron (not a trash), a fork count shows a fork (not a generic
 * file), a search shows a magnifier (not a bell). Whether a glyph's meaning fits a label is
 * a semantic judgment no mechanical check can make, so the oracle is an LLM-as-judge: the
 * adapter gathers each icon + the accessible label of its control as evidence, and the judge
 * decides fit against the rubric. Without a judge the criterion is honestly `skipped`.
 *
 * Faithfully grounded in real wrong-icon fixes: Gitea "use repo-forked icon to display forks
 * count" (gitea:edf0dfd1) and "issue close timeline icon" (gitea:3102c04c), and Mastodon
 * "outdated icon in notifications permissions banner" (mastodon:9576434d).
 */
export const iconCorrectness = archetype('icon-correctness', '0.1.0', () => {
  criterion(
    'icon-fits-meaning',
    'Every icon’s meaning fits its control: the glyph a control shows matches the action or label it stands for — a back affordance uses a left chevron/arrow, a fork count a fork, a search a magnifier, a delete a trash. An icon that is semantically wrong or misleading for its label is the escape (a generic glyph where a specific one is expected, a stale icon left after the action changed).',
    { under: 'success', scope: 'invariant', requires: 'render', seenIn: ['gitea:edf0dfd1', 'gitea:3102c04c', 'mastodon:9576434d'] },
    model(
      'You are given the icons rendered on a surface, each with the accessible label of the control it belongs to. ' +
        'PASS if every icon’s meaning is a sensible fit for its label/action (e.g. label "Back" → a left chevron or arrow; ' +
        '"Forks" → a fork/branch glyph; "Search" → a magnifier; "Delete"/"Remove" → a trash). ' +
        'FAIL if any icon is semantically wrong or misleading for its label — a glyph whose meaning does not match the action. ' +
        'Be conservative: when an icon clearly contradicts its label, fail and name the offending pair.',
    ),
  );
});
