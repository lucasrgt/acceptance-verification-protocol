import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface AccuracyRecord {
  readonly label: string;
  readonly detection: number;
  readonly total: number;
  readonly falseAlarms: number;
}

/** Parses the one-line calibration contract emitted by every accuracy benchmark. */
export function parseAccuracyMessage(message: string): AccuracyRecord | null {
  const match = message.match(
    /\[AVP(?: Design)?\]\s+(.+?)\s+detection=(\d+)\/(\d+)\s+false-alarm=(\d+)(?:\/\d+)?/,
  );
  if (!match) return null;
  return {
    label: match[1].trim(),
    detection: Number(match[2]),
    total: Number(match[3]),
    falseAlarms: Number(match[4]),
  };
}

/** Persists an executed calibration record when the scientific measurement run is active. */
export function recordAccuracyMessage(message: string): void {
  if (!process.env.ASSAY_RECORD) return;
  const record = parseAccuracyMessage(message);
  if (!record) return;
  const here = dirname(fileURLToPath(import.meta.url));
  const dir = resolve(here, 'results');
  mkdirSync(dir, { recursive: true });
  appendFileSync(
    resolve(dir, 'latest.jsonl'),
    JSON.stringify({ ts: new Date().toISOString(), ...record }) + '\n',
  );
}
