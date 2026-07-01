import { existsSync } from 'node:fs';
import puppeteer, { type Browser } from 'puppeteer-core';

/**
 * The browser substrate for the GEOMETRY design tier — the criteria that have no jsdom
 * path (jsdom's offsetWidth is 0; it has no layout engine). We drive an already-installed
 * Chrome/Edge via puppeteer-core (no ~150MB browser download) — a thin wire over a mature
 * substrate, the same philosophy as the React (RTL) and HTTP (fetch) adapters. Set
 * CHROME_PATH to override the auto-detected executable.
 */
const local = process.env.LOCALAPPDATA ?? '';
const CANDIDATES = [
  process.env.CHROME_PATH,
  // Windows — machine-wide and per-user installs, Chrome/Edge/Brave/Chromium
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  local && `${local}/Google/Chrome/Application/chrome.exe`,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
  local && `${local}/BraveSoftware/Brave-Browser/Application/brave.exe`,
  local && `${local}/Chromium/Application/chrome.exe`,
  // Linux
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/brave-browser',
  '/usr/bin/microsoft-edge',
  // macOS
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
];

/** The first installed Chrome/Edge executable, or null if none is found. */
export function chromePath(): string | null {
  return CANDIDATES.find((p): p is string => !!p && existsSync(p)) ?? null;
}

/** Launch a headless browser driving the installed Chrome/Edge. Throws if none is found. */
export async function openBrowser(): Promise<Browser> {
  const exe = chromePath();
  if (!exe) {
    throw new Error('No installed Chrome/Edge found for the geometry tier — set CHROME_PATH to a Chromium-based browser.');
  }
  return puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
}
