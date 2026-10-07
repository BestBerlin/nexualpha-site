import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json');
const puppeteer = require('puppeteer-core');

const base = process.env.WHITESPACE_URL || 'http://127.0.0.1:4281';
const stamp = new Date().toISOString().replace(/[:.]/g, '').replace('T', 'T').slice(0, 15);
const out = path.resolve(process.env.WHITESPACE_OUT || `../artifacts/whitespace-growth-ui-${stamp}`);
const locale = process.env.WHITESPACE_LOCALE || 'zh-Hans';

const routes = [
  '/',
  '/exchanges',
  '/exchanges/binance',
  '/compare/binance-vs-okx',
  '/news',
  '/news/tokenized-treasuries-structure-access-risks',
  '/activities',
  '/activities/research/binance',
  '/topics/derivatives',
  '/factbook',
  '/factbook/binance',
  '/rates',
  '/onchain',
  '/methodology',
  '/embed/calculator',
  '/partners',
  '/ref/binance',
];

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
];

function routeName(route) {
  return (route === '/' ? 'home' : route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')).toLowerCase();
}

async function screenshotSlices(page, dir, name, viewport) {
  const dims = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
  await page.screenshot({ path: path.join(dir, `${name}-${viewport.name}-full.png`), fullPage: true });
  const sliceHeight = Math.min(viewport.height, dims.height);
  const slices = [
    ['top', 0],
    ['mid', Math.max(0, Math.round((dims.height - sliceHeight) / 2))],
    ['bottom', Math.max(0, dims.height - sliceHeight)],
  ];
  for (const [label, y] of slices) {
    await page.screenshot({
      path: path.join(dir, `${name}-${viewport.name}-${label}.png`),
      clip: { x: 0, y, width: Math.min(viewport.width, dims.width), height: sliceHeight },
    });
  }
}

async function auditGeometry(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const docHeight = Math.max(doc.scrollHeight, body?.scrollHeight || 0);
    const headerBottom = Math.max(...Array.from(document.querySelectorAll('header, nav.clean-topbar, .v3-topbar')).map((el) => el.getBoundingClientRect().bottom + scrollY).filter(Number.isFinite), 0);
    const footerTop = Math.min(...Array.from(document.querySelectorAll('footer, .clean-footer')).map((el) => el.getBoundingClientRect().top + scrollY).filter(Number.isFinite), docHeight);
    const contentTags = new Set(['A','BUTTON','P','H1','H2','H3','H4','H5','H6','LI','TD','TH','SPAN','STRONG','SMALL','EM','LABEL','INPUT','SELECT','TEXTAREA','IMG','SVG','TABLE','SUMMARY','CODE','PRE','ARTICLE','DL','DT','DD']);
    const intervals = [];
    for (const el of document.querySelectorAll('body *')) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
      if (!contentTags.has(el.tagName)) {
        const hasVisualBox = (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent') || (style.borderTopWidth && parseFloat(style.borderTopWidth) > 0) || (style.borderBottomWidth && parseFloat(style.borderBottomWidth) > 0);
        const className = String(el.className || '');
        if (!hasVisualBox && !(el.textContent || '').trim()) continue;
        if (!/(card|panel|box|table-wrapper|code|preview|section|grid|list|facts|row|col|source|campaign|research)/i.test(className) && !['DL','DT','DD'].includes(el.tagName)) continue;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 2) continue;
      const top = Math.max(0, rect.top + scrollY);
      const bottom = Math.min(docHeight, rect.bottom + scrollY);
      if (bottom <= top) continue;
      intervals.push([top, bottom]);
    }
    intervals.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const item of intervals) {
      const last = merged[merged.length - 1];
      if (!last || item[0] > last[1] + 12) merged.push([...item]);
      else last[1] = Math.max(last[1], item[1]);
    }
    const gaps = [];
    for (let i = 0; i < merged.length - 1; i += 1) {
      const from = merged[i][1];
      const to = merged[i + 1][0];
      const size = to - from;
      if (size >= 180 && to > headerBottom + 40 && from < footerTop - 40) gaps.push({ from: Math.round(from), to: Math.round(to), size: Math.round(size) });
    }
    return {
      docHeight: Math.round(docHeight),
      viewport: { width: innerWidth, height: innerHeight },
      horizontalOverflow: Math.max(0, doc.scrollWidth - innerWidth),
      registrationPathIds: document.querySelectorAll('#registration-path').length,
      missingDetailLinks: Array.from(document.querySelectorAll('a[href*="/exchanges/"]')).map((a) => a.getAttribute('href') || '').filter((href) => /\/exchanges\/(htx|hashkey|aevo)(\?|#|$)/.test(href)),
      largeContentGaps: gaps,
    };
  });
}

await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const results = [];
try {
  const page = await browser.newPage();
  for (const viewport of viewports) {
    await page.setViewport(viewport);
    for (const route of routes) {
      const url = `${base}${route}${route.includes('?') ? '&' : '?'}locale=${encodeURIComponent(locale)}&visual_audit=1`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
      await page.evaluate(() => document.fonts?.ready).catch(() => {});
      const name = routeName(route);
      await screenshotSlices(page, out, name, viewport);
      const geometry = await auditGeometry(page);
      results.push({ route, url, viewport: viewport.name, ...geometry });
    }
  }
} finally {
  await browser.close();
}

const failures = results.filter((item) =>
  item.horizontalOverflow > 1 ||
  item.registrationPathIds > 1 ||
  item.missingDetailLinks.length > 0 ||
  item.largeContentGaps.some((gap) => gap.size >= 320)
);

const summary = { base, locale, out, routes: routes.length, viewports: viewports.length, results, failures };
await writeFile(path.join(out, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ out, checked: results.length, failures: failures.length }, null, 2));
assert.equal(failures.length, 0, JSON.stringify(failures.slice(0, 5), null, 2));
