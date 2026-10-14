import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { partnerRegistry } from '../src/data/partner-registry.js';
import { exchangeVenueForUrl } from '../src/data/exchange-outbound.js';
import { PLACEHOLDER_INVITE_CODE } from '../src/data/source-bound-cta.js';
import { localizedPath } from '../src/data/locale-routing.js';

const require = createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json');
const puppeteer = require('puppeteer-core');
const origin = process.env.UI_P0_ORIGIN || 'http://127.0.0.1:4173';
const output = resolve(process.env.UI_P0_OUTPUT || '../.ui-p0-evidence');
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const results = [];
try {
  const page = await browser.newPage();
  for (const locale of ['en', 'zh-hans']) {
    for (const width of [344, 360, 768, 884, 960, 1440]) {
      await page.setViewport({ width, height: 1000 });
      for (const route of ['exchanges', 'rates']) {
        await page.goto(`${origin}${localizedPath(`/${route}`, locale === 'zh-hans' ? 'zh-Hans' : locale)}`, { waitUntil: 'networkidle0' });
        await page.waitForSelector(route === 'exchanges' ? '.mx-row' : '.cost-decision__results h3');
        const metrics = await page.evaluate(() => {
          const box = el => {
            const r = el.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
          };
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            rows: [...document.querySelectorAll('.mx-row')].map(row => ({
              slug: row.dataset.slug,
              code: row.querySelector('.mx-code strong')?.textContent || null,
              row: box(row),
              chip: row.querySelector('.mx-code') ? box(row.querySelector('.mx-code')) : null,
            })),
            names: [...document.querySelectorAll('.cost-decision__results h3')].map(el => {
              const range = document.createRange();
              range.selectNodeContents(el);
              return { text: el.textContent, box: box(el), lines: [...range.getClientRects()].length };
            }),
            links: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')),
          };
        });
        assert.equal(metrics.overflow, false, `${locale}/${route}/${width}: page overflow`);
        for (const row of metrics.rows) {
          const partner = partnerRegistry[row.slug];
          const registeredCode = partner?.hasReferral && !PLACEHOLDER_INVITE_CODE.test(partner.inviteCode || '') ? partner.inviteCode || null : null;
          assert.equal(row.code, registeredCode, `${locale}/${width}/${row.slug}: registry code`);
          if (width >= 768 && width <= 960 && row.chip) {
            assert.ok(row.chip.top >= row.row.top - 1 && row.chip.bottom <= row.row.bottom + 1, `${locale}/${width}/${row.slug}: code outside its row`);
          }
        }
        for (const name of metrics.names) assert.equal(name.lines, 1, `${locale}/${width}: ${name.text} wrapped`);
        for (const href of metrics.links) assert.equal(exchangeVenueForUrl(href), null, `${locale}/${route}/${width}: direct exchange link ${href}`);
        if ([344, 884, 1440].includes(width)) {
          await page.screenshot({ path: resolve(output, `${locale}-${route}-${width}.png`), fullPage: true });
          const section = await page.$(route === 'exchanges' ? '.mx-scroll' : '.cost-decision__results');
          await section.screenshot({ path: resolve(output, `${locale}-${route}-${width}-detail.png`) });
        }
        results.push({ locale, route, width, ...metrics });
      }
    }
  }
  await page.setViewport({ width: 344, height: 1000 });
  for (const route of ['activities', 'exchanges/bitget', 'exchanges/okx', 'exchanges/binance', 'funding-rates', 'embed/calculator']) {
    await page.goto(`${origin}${localizedPath(`/${route}`, 'zh-Hans')}`, { waitUntil: 'networkidle0' });
    const links = await page.$$eval('a[href]', anchors => anchors.map(a => a.getAttribute('href')));
    for (const href of links) assert.equal(exchangeVenueForUrl(href), null, `${route}: direct exchange link ${href}`);
    await page.screenshot({ path: resolve(output, `zh-hans-${route.replaceAll('/', '-')}-344.png`), fullPage: true });
    results.push({ locale: 'zh-hans', route, width: 344, links });
  }
  await writeFile(resolve(output, 'browser-results.json'), JSON.stringify(results, null, 2));
  console.log(`PASS: ${results.length} local page/viewport checks; screenshots and metrics: ${output}`);
} finally {
  await browser.close();
}
