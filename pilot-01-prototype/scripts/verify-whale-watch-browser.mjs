#!/usr/bin/env node
// Built SSR + hydration layout QA. Synthetic events exercise layout only, never live-data evidence.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, appendFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createNewsSsrRenderer } from '../server/news-ssr.mjs';
import { contentTypeForAssetPath, resolveAssetPath } from '../server/asset-path.mjs';
import { localizedHref } from '../src/data/locale-routing.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = path.join(root, 'dist');
const client = path.join(dist, 'client');
const out = path.join(root, '.private/whale-watch-browser');
await mkdir(out, { recursive: true });
const snapshot = JSON.parse(await readFile(process.argv[2], 'utf8'));
const { default: worker } = await import(pathToFileURL(path.join(dist, 'server/index.js')));
const render = createNewsSsrRenderer(dist);
const assets = { fetch: async request => {
  const file = resolveAssetPath(client, new URL(request.url).pathname);
  if (!file) return new Response('missing', { status: 404 });
  return new Response(await readFile(file), { headers: { 'content-type': contentTypeForAssetPath(file) } });
}};
let current = snapshot;
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.headers.accept?.includes('text/html')) await appendFile(path.join(out, 'native-requests.jsonl'), JSON.stringify({path:url.pathname,time:new Date().toISOString(),userAgent:req.headers['user-agent']})+'\n');
    const response = url.pathname === '/api/whales.json'
      ? new Response(JSON.stringify(current), { headers: { 'content-type': 'application/json' } })
      : await worker.fetch(new Request(url, { headers: req.headers }), { ASSETS: assets, NEWS_SSR_RENDER: render, WHALES_READ: async () => current, RADAR_READ: async () => current });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) { res.writeHead(500); res.end(error.stack); }
});
await new Promise(resolve => server.listen(Number(process.env.QA_PORT || 0), '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
if (process.argv.includes('--http-only')) {
  const locales = ['en','zh-Hans','zh-Hant','es','pt-BR','fr','de','it','ja','ko','ru','tr','id','vi','ar','ur','uk'];
  const routes = [];
  try {
    for (const locale of locales) {
      const response = await fetch(base + localizedHref('/whales', { locale }));
      const html = await response.text();
      assert.equal(response.status, 200, locale);
      assert.match(html, /Dataset/, locale);
      assert.match(html, /ItemList/, locale);
      assert.match(html, /whales-page/, locale);
      const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
      const list = schemas.flatMap(item => item['@graph'] || [item]).find(item => item['@type'] === 'ItemList');
      assert.equal(list.numberOfItems, 8, locale);
      routes.push({ locale, status: response.status, items: list.numberOfItems });
    }
    current = null;
    const empty = await (await fetch(base + '/')).text();
    const board = empty.match(/<section class="[^"]*h7-mv[\s\S]*?<!--whales-end-->/)?.[0] || '';
    assert.ok(board);
    assert.doesNotMatch(board, /<li|h7-mv-pad|h7-mv-empty|—/);
    await writeFile(path.join(out, 'http-results.json'), JSON.stringify({ routes, emptyRows: 0, provenance: 'synthetic fixture; built Worker + built SSR' }, null, 2));
    console.log(JSON.stringify({ locales: routes.length, itemsEach: 8, emptyRows: 0 }));
  } finally { await new Promise(resolve => server.close(resolve)); }
  process.exit(0);
}
if (process.argv.includes('--serve-only')) {
  console.log(`Whale layout fixture server: ${base} (synthetic events only)`);
  await new Promise(() => {});
}
const require = createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json');
const puppeteer = require('puppeteer-core');
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--disable-background-networking', '--no-first-run', '--disable-sync'] });
const axePath = require.resolve('axe-core/axe.min.js');
const locales = ['en','zh-Hans','zh-Hant','es','pt-BR','fr','de','it','ja','ko','ru','tr','id','vi','ar','ur','uk'];
const samples = [];
try {
  for (const locale of locales) {
    const response = await fetch(base + localizedHref('/whales', { locale }));
    const html = await response.text();
    assert.equal(response.status, 200, locale);
    assert.match(html, /application\/ld\+json/, locale);
    assert.match(html, /Dataset/, locale);
    assert.match(html, /ItemList/, locale);
  }
  for (const width of [360, 390, 1440]) {
    for (const locale of ['en', 'zh-Hans', 'ar']) {
      for (const route of ['/', '/whales']) {
        const page = await browser.newPage();
        const userAgent = width === 360
          ? 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
          : width === 390
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
          : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
        await page.setUserAgent(userAgent);
        await page.setViewport({ width, height: width < 500 ? 844 : 1100, isMobile: width < 500, hasTouch: width < 500, deviceScaleFactor: 1 });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error' && /React|hydrat|#418|#423/i.test(message.text())) errors.push(message.text()); });
        await page.evaluateOnNewDocument(() => {
          window.__whaleCls = 0;
          new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__whaleCls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
        });
        await page.goto(base + localizedHref(route, { locale }), { waitUntil: 'networkidle0' });
        const selector = route === '/' ? '.h7-mv' : '.whales-page';
        await page.waitForSelector(selector);
        await page.$eval(selector, element => element.scrollIntoView({ block: 'center' }));
        await new Promise(resolve => setTimeout(resolve, 800));
        const metrics = await page.$eval(selector, element => {
          const visible = el => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0;
          const links = [...element.querySelectorAll('a')].filter(visible).map(el => ({ height: el.getBoundingClientRect().height, href: el.href }));
          const amounts = [...element.querySelectorAll('.h7-wh-amt')].filter(visible).map(el => ({ text: el.textContent, fits: el.scrollWidth <= el.clientWidth, color: getComputedStyle(el).color }));
          return { text: element.textContent, visibleRows: [...element.querySelectorAll('li')].filter(visible).length, width: element.getBoundingClientRect().width, overflow: document.documentElement.scrollWidth > window.innerWidth, links, amounts, cls: window.__whaleCls, ua: navigator.userAgent };
        });
        assert.ok(!metrics.overflow, `${locale} ${width} ${route}: overflow`);
        assert.doesNotMatch(metrics.ua, /HeadlessChrome/);
        assert.ok(metrics.amounts.every(amount => amount.fits), `${locale} ${width}: clipped amount`);
        assert.ok(metrics.links.every(link => link.height >= 44), `${locale} ${width} ${route}: short tap target`);
        assert.deepEqual(errors, [], `${locale} ${width} ${route}: hydration errors`);
        if (route === '/') assert.equal(metrics.visibleRows, width < 500 ? 6 : 8);
        await page.addScriptTag({ path: axePath });
        const axe = await page.evaluate(async selector => { const result = await window.axe.run(document.querySelector(selector), { runOnly: { type: 'rule', values: ['color-contrast'] } }); return result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })); }, selector);
        assert.deepEqual(axe, [], `${locale} ${width} ${route}: contrast violations`);
        const name = `${route === '/' ? 'home' : 'whales'}-${locale}-${width}`;
        await (await page.$(selector)).screenshot({ path: path.join(out, name + '.png') });
        samples.push({ name, provenance: 'synthetic layout fixture, built SSR and browser hydration', ...metrics, errors, contrastViolations: axe });
        await page.close();
      }
    }
  }
  current = null;
  const empty = await fetch(base + '/');
  const html = await empty.text();
  const board = html.match(/<section class="[^"]*h7-mv[\s\S]*?<!--whales-end-->/)?.[0] || '';
  assert.ok(board);
  assert.doesNotMatch(board, /<li|h7-mv-pad|h7-mv-empty|—/);
  await writeFile(path.join(out, 'results.json'), JSON.stringify({ locales: locales.length, emptyRows: 0, samples }, null, 2));
  console.log(JSON.stringify({ locales: locales.length, screenshots: samples.length, emptyRows: 0, output: out }));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
