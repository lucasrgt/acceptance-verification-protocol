import type { Judge, JudgeRequest, JudgeVerdict } from '../core/dsl';

/**
 * The reference `model`-oracle judge: an LLM-as-judge backed by Claude. AVP's core
 * stays judge-neutral (the `Judge` type lives in core/dsl) — this is one
 * implementation, kept OUT of the core so the library never hard-depends on the
 * Anthropic SDK. The SDK is loaded lazily and only when the judge actually runs;
 * `@anthropic-ai/sdk` is an optional peer dependency. Configure via env/options,
 * never a config file (ADR 0001).
 *
 *   import { claudeJudge } from '@aerofortress/assay/judge';
 *   const verdict = await verify(actionEffect, subject, { judge: claudeJudge() });
 *
 * Tests inject a fake `client` so the prompt-building and parsing are deterministic
 * without a network call; the live path runs only when a real client (or
 * ANTHROPIC_API_KEY) is present.
 */

/** The minimal shape this judge needs from an Anthropic client — so tests can stub it without the SDK. */
export interface AnthropicLike {
  readonly messages: {
    create(args: Record<string, unknown>): Promise<{ readonly content: ReadonlyArray<{ type: string; text?: string }> }>;
  };
}

export interface ClaudeJudgeOptions {
  /** API key (defaults to the ANTHROPIC_API_KEY env var via the SDK's own resolution). */
  readonly apiKey?: string;
  /** Model id. Defaults to `claude-opus-4-8` (override to `claude-haiku-4-5` for a cheaper judge). */
  readonly model?: string;
  /** Inject a client (real or fake). When absent, `@anthropic-ai/sdk` is loaded lazily. */
  readonly client?: AnthropicLike;
  /** Per-request timeout in ms, passed to the SDK client (default: the SDK's own default). */
  readonly timeoutMs?: number;
  /** Max output tokens for the verdict (default 1024 — a verdict is one small JSON object). */
  readonly maxTokens?: number;
  /** Appended to the judge's system prompt (domain guidance) — never replaces the fail-closed core. */
  readonly systemSuffix?: string;
  /** Extra retries at the judge level after the SDK's own retries are exhausted (default 1). */
  readonly retries?: number;
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    pass: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: ['pass', 'reason'],
  additionalProperties: false,
} as const;

const SYSTEM =
  'You are an acceptance-criteria judge for the AVP (Acceptance Verification Protocol). ' +
  'Decide PASS or FAIL strictly against the rubric, using only the supplied evidence. ' +
  'Be conservative: a false PASS is the catastrophic error — when the evidence is ambiguous, ' +
  'insufficient, or only weakly satisfies the rubric, return pass=false. Give a one-sentence reason ' +
  'written for the engineer who must fix it.';

function buildPrompt(request: JudgeRequest): string {
  const { id, statement, rubric } = request.criterion;
  return [
    `Criterion: ${id}`,
    `Statement: ${statement}`,
    `Rubric: ${rubric}`,
    '',
    'Evidence (the observed runtime state):',
    JSON.stringify(request.evidence, null, 2),
    '',
    'Return a JSON object {"pass": boolean, "reason": string}.',
  ].join('\n');
}

function parseVerdict(content: ReadonlyArray<{ type: string; text?: string }>, model: string): JudgeVerdict {
  const text = content.find((b) => b.type === 'text' && typeof b.text === 'string')?.text ?? '';
  try {
    const parsed = JSON.parse(text) as { pass?: unknown; reason?: unknown };
    if (typeof parsed.pass === 'boolean') {
      return { pass: parsed.pass, reason: typeof parsed.reason === 'string' ? parsed.reason : '', model };
    }
  } catch {
    /* fall through to fail-closed */
  }
  // Fail closed: a judge that can't produce a verdict must not pass the criterion.
  return { pass: false, reason: 'The judge did not return a parseable verdict — treated as a failure (fail-closed).', model };
}

async function defaultClient(options: ClaudeJudgeOptions): Promise<AnthropicLike> {
  // Indirect specifier so the type-checker doesn't require the optional SDK to be installed.
  const pkg = '@anthropic-ai/sdk';
  const mod = (await import(pkg)) as {
    default: new (opts?: { apiKey?: string; timeout?: number }) => AnthropicLike;
  };
  return new mod.default({
    ...(options.apiKey ? { apiKey: options.apiKey } : {}),
    ...(options.timeoutMs ? { timeout: options.timeoutMs } : {}),
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Builds a Claude-backed `model`-oracle judge. */
export function claudeJudge(options: ClaudeJudgeOptions = {}): Judge {
  const model = options.model ?? 'claude-opus-4-8';
  const retries = options.retries ?? 1;
  const system = options.systemSuffix ? `${SYSTEM} ${options.systemSuffix}` : SYSTEM;
  // Memoized: the client (and its lazy SDK import) is built once per judge, not per call.
  let clientPromise: Promise<AnthropicLike> | null = null;
  const getClient = () => (clientPromise ??= options.client ? Promise.resolve(options.client) : defaultClient(options));

  return async (request: JudgeRequest): Promise<JudgeVerdict> => {
    let client: AnthropicLike;
    try {
      client = await getClient();
    } catch (e) {
      clientPromise = null; // a failed load shouldn't poison later calls
      return { pass: false, reason: `Judge unavailable (could not load the Anthropic client): ${(e as Error).message}`, model };
    }
    // The SDK already retries 429/5xx internally; this outer loop adds a last-resort
    // retry so one transient failure doesn't fail-close a criterion.
    let lastError = '';
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await client.messages.create({
          model,
          max_tokens: options.maxTokens ?? 1024,
          system,
          output_config: { format: { type: 'json_schema', schema: VERDICT_SCHEMA } },
          messages: [{ role: 'user', content: buildPrompt(request) }],
        });
        return parseVerdict(res.content, model);
      } catch (e) {
        lastError = (e as Error).message;
        if (attempt < retries) await sleep(1000 * (attempt + 1));
      }
    }
    return { pass: false, reason: `Judge call failed after ${retries + 1} attempt(s): ${lastError}`, model };
  };
}
