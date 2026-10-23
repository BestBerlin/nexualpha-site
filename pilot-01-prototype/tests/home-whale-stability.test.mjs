import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import { whalesBodyHtml, whaleAgoLabel } from '../src/data/whales-home.js';

const sharedPackage = '/Users/bestberlin/.codex/shared-tools/web-quality/package.json';
const chromePath = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium'].filter(Boolean).find(existsSync);
const browserSkip = (process.env.CODEX_SANDBOX === 'seatbelt' && 'Chrome launch is unavailable in the seatbelt sandbox; run outside sandbox for geometry evidence') || (!chromePath && 'requires Chrome or CHROME_PATH') || (!existsSync(sharedPackage) && 'requires shared puppeteer-core');

// Test data only: no market feed or public claim is produced by this browser geometry regression.
const at = '2026-10-19T00:00:00Z';
const snapshot = { status: 'ok', updatedAt: at, signals: Array.from({ length: 8 }, (_, i) => ({ id: `s${i}`, coin: i % 2 ? 'BTC' : 'SOL', side: 'long', signalType: 'accumulation', totalUsd: 6e6 + i * 1e6, time: at })) };
const styles = ['src/styles/v7/home7.css', 'src/styles/v7/movers-owner.css'].map(file => readFileSync(file, 'utf8')).join('\n');

test('whale columns and row text retain their horizontal positions when relative-time and pulse labels activate', { skip: browserSkip }, async () => {
  const puppeteer = createRequire(sharedPackage)('puppeteer-core');
  const userDataDir = await mkdtemp('.tmp-home-whale-stability-');
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath: chromePath, headless: 'new', userDataDir, args: ['--no-first-run', '--disable-background-networking', '--disable-extensions'] });
    for (const locale of ['en', 'zh-Hans', 'tr']) for (const width of [390, 768, 1440]) {
      const page = await browser.newPage();
      try {
        await page.setViewport({ width, height: 900 });
        await page.setContent(`<html lang="${locale}"><style>body{margin:0}${styles}</style><main class="h7"><section class="h7-in h7-mv h7-mv-owner h7-whales"><div class="h7-mv-body">${whalesBodyHtml(snapshot, locale)}</div></section></main></html>`);
        const geometry = () => page.evaluate(() => [...document.querySelectorAll('.h7-wh-list, .h7-wh-list li a, .h7-wh-text, .h7-mv-mk, time')].filter(el => el.getClientRects().length).map(el => {
          const { x, width } = el.getBoundingClientRect();
          return { x, width };
        }));
        const before = await geometry();
        await page.evaluate(label => {
          document.querySelector('.h7-whales').dataset.live = '';
          document.querySelectorAll('time').forEach(time => { time.textContent = label; });
          document.querySelectorAll('[data-mv-key]').forEach((row, i) => { if (i < 3) row.dataset.pulse = String(i + 1); });
        }, whaleAgoLabel(at, Date.parse(at) + 12 * 60 * 1000, locale));
        assert.deepEqual(await geometry(), before, `${locale}/${width}: horizontal geometry stays fixed`);
        const grid = await page.$eval('.h7-wh-list li a', el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
        assert.equal(grid, 2, `${locale}/${width}: no content-sized third column`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${locale}/${width}: no overflow`);
      } finally { await page.close(); }
    }
  } finally {
    await browser?.close();
    await rm(userDataDir, { recursive: true, force: true });
  }
});
