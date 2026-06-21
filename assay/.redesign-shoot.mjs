import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:7770';
const out = process.argv[3] ?? 'C:/Users/lucas/dev/pleiades-harness/.redesign/live.png';
const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);

const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox', '--disable-gpu', '--force-color-profile=srgb'] });
const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1.5 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
await page.goto(url, { waitUntil: 'networkidle2' }).catch((e) => errors.push('goto: ' + e.message));
await new Promise((r) => setTimeout(r, 1200));
const diag = await page.evaluate(() => {
  const root = document.getElementById('root');
  return { rootKids: root ? root.childElementCount : -1, bodyText: (document.body.innerText || '').slice(0, 160), els: document.querySelectorAll('*').length };
});
await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log(JSON.stringify({ url, out, diag, errors: errors.slice(0, 5) }, null, 2));
