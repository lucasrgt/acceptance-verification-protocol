/* global console, process */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import {
  AvpFail,
  archetype,
  criterion,
  human,
  mechanical,
  model,
  runVerification,
} from '../dist/index.js';

const CRITERIA_PER_SUBJECT = 16;
const DEFAULT_CORPORA = [1_024, 10_000];

function parseCorpora(argv) {
  const values = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--corpus') {
      const value = Number(argv[index + 1]);
      if (!Number.isSafeInteger(value) || value < 1) {
        throw new Error('--corpus must be a positive integer');
      }
      values.push(value);
      index += 1;
    }
  }
  return values.length > 0 ? values : DEFAULT_CORPORA;
}

function buildStressArchetype() {
  return archetype(
    'engine-stress-fixture',
    '1.0.0',
    () => {
      for (let index = 0; index < CRITERIA_PER_SUBJECT; index += 1) {
        criterion(
          `stress-${String(index).padStart(2, '0')}`,
          `Synthetic criterion ${index} remains satisfied`,
          { substrate: 'static', seenIn: ['benchmark-fixture'] },
          mechanical(async (probe) => {
            await probe.act();
            probe.expect.assertCriterion(index);
          }),
        );
      }
    },
    {
      description:
        'Off-catalog fixture for measuring the AVP executor under deterministic load.',
    },
  );
}

function hooksForSubject(failureIndex, infrastructureFailure) {
  return {
    probe() {
      return {
        async act() {},
        expect: {
          assertCriterion(index) {
            if (index !== failureIndex) return;
            if (infrastructureFailure) {
              throw new Error(`fixture transport unavailable at criterion ${index}`);
            }
            throw new AvpFail(`known vulnerable fixture at criterion ${index}`, {
              failureIndex: index,
            });
          },
        },
      };
    },
  };
}

async function auditFailClosedBehavior() {
  const unavailableOracles = archetype('unavailable-oracles', '1.0.0', () => {
    criterion(
      'model-without-judge',
      'A model-backed requirement must be decided',
      { substrate: 'model' },
      model('Return pass only when the evidence proves the requirement.'),
    );
    criterion(
      'human-without-reviewer',
      'A human-backed requirement must be reviewed',
      {},
      human('Review the synthetic evidence.'),
    );
  });
  const unavailable = await runVerification('unavailable-oracles', unavailableOracles, {
    probe() {
      throw new Error('Mechanical probe must not be requested');
    },
  });

  const infrastructure = archetype('infrastructure-failure', '1.0.0', () => {
    criterion(
      'broken-probe',
      'Infrastructure errors cannot manufacture a green verdict',
      { substrate: 'static' },
      mechanical(() => {
        throw new Error('synthetic infrastructure failure');
      }),
    );
  });
  const broken = await runVerification('infrastructure-failure', infrastructure, {
    probe() {
      return { async act() {}, expect: {} };
    },
  });

  return {
    missingOracleOutcome: unavailable.outcome,
    missingOracleStatuses: unavailable.results.map(({ status }) => status),
    infrastructureOutcome: broken.outcome,
    infrastructureStatus: broken.results[0]?.status,
    passed:
      unavailable.outcome === 'inconclusive' &&
      unavailable.unresolved === 2 &&
      unavailable.results.every(({ status }) => status === 'unresolved') &&
      broken.outcome === 'fail' &&
      broken.results[0]?.status === 'fail',
  };
}

async function runCorpus(size, protocolVersion) {
  const fixture = buildStressArchetype();
  const started = performance.now();
  const memoryBefore = process.memoryUsage().heapUsed;
  let corrected = 0;
  let vulnerable = 0;
  let expectedFailures = 0;
  let detectedFailures = 0;
  let falseAlarms = 0;
  let unexpectedCriterionResults = 0;
  let infrastructureFailures = 0;

  for (let index = 0; index < size; index += 1) {
    const isVulnerable = index % 2 === 1;
    const failureIndex = isVulnerable ? index % CRITERIA_PER_SUBJECT : -1;
    const infrastructureFailure = isVulnerable && index % 257 === 0;
    const verdict = await runVerification(
      `stress-subject-${index}`,
      fixture,
      hooksForSubject(failureIndex, infrastructureFailure),
    );
    const failed = verdict.results.filter(({ status }) => status === 'fail');

    if (isVulnerable) {
      vulnerable += 1;
      expectedFailures += 1;
      if (infrastructureFailure) infrastructureFailures += 1;
      if (
        verdict.outcome === 'fail' &&
        failed.length === 1 &&
        failed[0]?.criterionId === fixture.criteria[failureIndex]?.id
      ) {
        detectedFailures += 1;
      } else {
        unexpectedCriterionResults += 1;
      }
    } else {
      corrected += 1;
      if (verdict.outcome !== 'pass') falseAlarms += 1;
      if (
        verdict.results.length !== CRITERIA_PER_SUBJECT ||
        verdict.results.some(({ status }) => status !== 'pass')
      ) {
        unexpectedCriterionResults += 1;
      }
    }
  }

  const failClosed = await auditFailClosedBehavior();
  const durationMs = Math.round(performance.now() - started);
  const heapDeltaBytes = process.memoryUsage().heapUsed - memoryBefore;
  const result = {
    schema: 1,
    benchmark: 'avp-executor-stress',
    protocolVersion,
    corpus: {
      subjects: size,
      criteriaPerSubject: CRITERIA_PER_SUBJECT,
      criterionVerdicts: size * CRITERIA_PER_SUBJECT,
      corrected,
      vulnerable,
      infrastructureFailures,
    },
    accuracy: {
      expectedFailures,
      detectedFailures,
      missedFailures: expectedFailures - detectedFailures,
      falseAlarms,
      unexpectedCriterionResults,
    },
    failClosed,
    performance: {
      durationMs,
      subjectsPerSecond: Number(((size * 1_000) / Math.max(durationMs, 1)).toFixed(2)),
      criterionVerdictsPerSecond: Number(
        (((size * CRITERIA_PER_SUBJECT) * 1_000) / Math.max(durationMs, 1)).toFixed(2),
      ),
      heapDeltaBytes,
    },
    passed:
      detectedFailures === expectedFailures &&
      falseAlarms === 0 &&
      unexpectedCriterionResults === 0 &&
      failClosed.passed,
    limitations: [
      'The corpus is deterministic and synthetic.',
      'This benchmark measures executor integrity and fail-closed behavior, not the semantic accuracy of public AVP criteria.',
      'The fixture uses in-process mechanical probes and does not include browser, network, model, or human latency.',
    ],
  };
  return result;
}

function renderReport(result) {
  const { corpus, accuracy, failClosed, performance } = result;
  return `# AVP executor stress: ${corpus.subjects.toLocaleString('en-US')} subjects

This is a deterministic, off-catalog stress fixture for the AVP execution engine. It is not evidence that AVP detects every real product failure.

| Measurement | Result |
| --- | ---: |
| Subjects | ${corpus.subjects.toLocaleString('en-US')} |
| Criteria per subject | ${corpus.criteriaPerSubject} |
| Criterion verdicts | ${corpus.criterionVerdicts.toLocaleString('en-US')} |
| Corrected subjects | ${corpus.corrected.toLocaleString('en-US')} |
| Vulnerable subjects | ${corpus.vulnerable.toLocaleString('en-US')} |
| Expected failures detected | ${accuracy.detectedFailures}/${accuracy.expectedFailures} |
| Missed failures | ${accuracy.missedFailures} |
| False alarms | ${accuracy.falseAlarms} |
| Unexpected result shapes | ${accuracy.unexpectedCriterionResults} |
| Missing oracles fail closed | ${failClosed.missingOracleOutcome === 'inconclusive' ? 'yes' : 'no'} |
| Infrastructure errors fail closed | ${failClosed.infrastructureOutcome === 'fail' ? 'yes' : 'no'} |
| Wall time | ${performance.durationMs.toLocaleString('en-US')} ms |
| Criterion verdicts per second | ${performance.criterionVerdictsPerSecond.toLocaleString('en-US')} |
| Overall result | ${result.passed ? 'PASS' : 'FAIL'} |

## What this proves

The engine preserved the expected verdict for every fixture, distinguished corrected subjects from known vulnerable subjects, and refused green outcomes when an oracle or verifier infrastructure was unavailable.

## What this does not prove

${result.limitations.map((limitation) => `- ${limitation}`).join('\n')}
`;
}

async function packageVersion() {
  const packageJson = JSON.parse(
    await readFile(resolve(import.meta.dirname, '..', 'package.json'), 'utf8'),
  );
  return packageJson.version;
}

async function main() {
  const protocolVersion = await packageVersion();
  for (const size of parseCorpora(process.argv.slice(2))) {
    const result = await runCorpus(size, protocolVersion);
    const output = resolve(
      import.meta.dirname,
      '..',
      '..',
      'benchmarks',
      'results',
      `v${protocolVersion}-stress-${size}`,
      'summary.json',
    );
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    await writeFile(resolve(dirname(output), 'REPORT.md'), renderReport(result), 'utf8');
    console.log(
      `${result.passed ? 'PASS' : 'FAIL'} ${size} subjects, ` +
        `${result.corpus.criterionVerdicts} criterion verdicts, ` +
        `${result.performance.durationMs} ms`,
    );
    if (!result.passed) process.exitCode = 1;
  }
}

await main();
