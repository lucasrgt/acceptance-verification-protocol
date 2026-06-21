import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const out = 'C:/Users/lucas/dev/pleiades-harness/.redesign';
const views = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox','--force-color-profile=srgb'] });
const p = await b.newPage();
await p.setViewport({ width: +(process.env.W || 1366), height: 900, deviceScaleFactor: 1.4 });
await p.goto('http://localhost:7770', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 1200));
for (const v of views) {
  // "@text" → click any element containing text (sessions/threads); else a nav item startsWith
  const sessionMode = v.startsWith('@');
  const label = (sessionMode ? v.slice(1) : v).toUpperCase();
  const clicked = await p.evaluate((label, sessionMode) => {
    const els = [...document.querySelectorAll('.side-item, button, [role="button"], .thread-item, [class*="session"], [class*="thread"]')];
    const btn = els.find(b => {
      const t = (b.textContent || '').trim().toUpperCase();
      return sessionMode ? t.includes(label) : t.startsWith(label);
    });
    if (btn) { btn.click(); return true; } return false;
  }, label, sessionMode);
  await new Promise(r => setTimeout(r, 800));
  const name = (sessionMode ? v.slice(1) : v).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  await p.screenshot({ path: `${out}/view-${name}.png`, fullPage: false });
  console.log(v, clicked ? 'ok' : 'NOT-FOUND');
}
await b.close();
