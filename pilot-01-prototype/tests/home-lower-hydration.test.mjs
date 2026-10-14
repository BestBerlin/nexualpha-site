import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import React, { act } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { createSsrHarness, hydrateInJsdom, hydrationErrors } from './helpers/ssr-hydration-harness.mjs';

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

test('lower home hydrates across clock drift and motion preferences in both locales and hero variants', async () => {
  const { HomeBelowFold } = await harness.vite.ssrLoadModule('/src/components/v7/home7-below.jsx');
  const { h7Copy } = await harness.vite.ssrLoadModule('/src/components/v7/home7-copy.js');
  const { withHomeHeroVariant } = await harness.vite.ssrLoadModule('/src/components/v7/home7-hero-variants.js');
  const funding = JSON.parse(readFileSync(new URL('./fixtures/funding-rates-live-2026-10-14.json', import.meta.url)));
  const snapshot = '2026-10-14T00:00:00Z';
  for (const venue of Object.values(funding.venues)) for (const row of venue.rows) row.nextAt = '2026-10-14T01:00:00Z';
  const feed = { generatedAt: snapshot, items: [{ id: 'notice', venue: 'okx', category: 'news', title: 'Official notice', url: 'https://www.okx.com/help/notice', publishedAt: '2026-10-13T23:59:00Z', expiresAt: '2026-10-14T00:01:00Z' }] };
  const originalNow = Date.now;
  for (const locale of ['en', 'zh-Hans']) for (const variant of ['a', 'b']) for (const motion of [false, true]) for (const seeded of [false, true]) {
    const props = { renderedAt: snapshot, t: h7Copy(locale), locale, market: undefined, fundingFeed: { ...funding, generatedAt: snapshot }, initialOfficialAnnouncements: seeded ? feed : undefined, vol: 10000, setVol() {}, mode: 'taker', setMode() {}, product: 'perp', setProduct() {}, calc: { rows: [] }, priced: [] };
    const element = () => withHomeHeroVariant(React.createElement(HomeBelowFold, props), variant);
    Date.now = () => Date.parse(snapshot);
    const html = renderToString(element());
    const dom = new JSDOM(`<div id="root">${html}</div>`, { url: 'https://nexualpha.com/' });
    dom.window.matchMedia = () => ({ matches: motion });
    const overrides = { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true, fetch: async () => new Response('{}', { status: 404 }), IntersectionObserver: class { observe() {} disconnect() {} } };
    const saved = new Map(Object.keys(overrides).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    let root;
    const errors = [];
    try {
      for (const [key, value] of Object.entries(overrides)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
      // Deferred hydration occurs after the relative-minute and expiry boundaries.
      Date.now = () => Date.parse(snapshot) + 125000;
      const container = dom.window.document.getElementById('root');
      await act(async () => { root = hydrateRoot(container, element(), { onRecoverableError: e => errors.push(e.message) }); });
      assert.deepEqual(errors, [], `${locale}/${variant}/reduce=${motion}/seeded=${seeded}`);
      assert.ok(container.querySelector('.h7-fr-name').textContent);
      if (seeded) assert.match(container.querySelector('.h7-il time').textContent, /3|٣/, 'relative age updates after mount');
      const countdown = container.querySelector('.h7-fr-cd').textContent;
      assert.equal(countdown.split(':').length, motion ? 2 : 3, 'motion preference applies after mount');
    } finally {
      if (root) await act(async () => root.unmount());
      for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
      Date.now = originalNow;
      dom.window.close();
    }
  }
});

test('served home reuses its serialized render clock when the complete page hydrates later', async () => {
  const funding = JSON.parse(readFileSync(new URL('./fixtures/funding-rates-live-2026-10-14.json', import.meta.url)));
  const flash = { kind: 'stream', items: [{ id: 'seed', path: '/flash/seed-notice', time: '2026-10-14T00:00:00Z', type: 'news', typeLabel: 'News', headline: 'Seeded official flash', lang: 'en' }] };
  const ticker = { generatedAt: '2026-10-14T00:00:00Z', items: [{ sym: 'BTC', price: '$82,000', change: '+1.00%', dir: 'up' }] };
  const movers = { generatedAt: '2026-10-14T00:00:00Z', up: [{ sym: 'BTC', slug: 'bitcoin', price: '$82,000', change: '+1.00%', dir: 'up' }], down: [], source: 'fixture' };
  for (const path of ['/', '/zh-hans']) for (const heroVariant of ['a', 'b']) {
    const html = await harness.render(`https://nexualpha.com${path}`, { funding, flash, ticker, movers, heroVariant });
    // Owner 2026-10-14: no flash rail and no hero device mockup on home, even when the state carries both snapshots.
    assert.doesNotMatch(html, /Seeded official flash|h7-flash/);
    assert.doesNotMatch(html, /h7-terminal|hx-terminal-host/);
    assert.match(html, /data-rendered-at="[^"]+"/);
    const document = `<div id="root">${html}</div><script type="application/json" id="nexualpha-prerender-state">${JSON.stringify({ funding, flash, ticker, movers, heroVariant })}</script>`;
    const result = await hydrateInJsdom(harness.vite, document, `https://nexualpha.com${path}`, { fixedNow: Date.now() + 125000, timeoutMs: 800 });
    assert.deepEqual(hydrationErrors(result.errors.filter(message => !message.includes('Not implemented: HTMLCanvasElement.prototype.getContext'))), [], `${path}/${heroVariant}`);
  }
});

test('funding venue fits its cell without page overflow at narrow widths', { skip: process.env.HOME_FUNDING_LAYOUT !== '1' }, async () => {
  const { createRequire } = await import('node:module');
  const { mkdtempSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const puppeteer = createRequire('/Users/bestberlin/.codex/shared-tools/web-quality/package.json')('puppeteer-core');
  const { FundingBoard } = await harness.vite.ssrLoadModule('/src/components/v7/home7-funding.jsx');
  const feed = JSON.parse(readFileSync(new URL('./fixtures/funding-rates-live-2026-10-14.json', import.meta.url)));
  const css = readFileSync(new URL('../src/styles/v7/home7.css', import.meta.url), 'utf8');
  const profile = mkdtempSync(join(tmpdir(), 'home-funding-layout-'));
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', userDataDir: profile, headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    for (const locale of ['en', 'zh-Hans']) for (const width of [320, 390, 530, 640]) {
      await page.setViewport({ width, height: 900 });
      const html = renderToString(React.createElement(FundingBoard, { locale, initialFeed: feed }));
      await page.setContent(`<style>body{margin:0}*{box-sizing:border-box}${css}</style><main class="h7">${html}</main>`);
      const geometry = await page.evaluate(() => {
        const row = document.querySelector('a[href$="/hyperliquid"]');
        const venue = row.querySelector('.h7-fr-v').getBoundingClientRect();
        const name = row.querySelector('.h7-fr-name').getBoundingClientRect();
        const rate = row.querySelector('.h7-fr-n').getBoundingClientRect();
        return { nameRight: name.right, venueRight: venue.right, rateLeft: rate.left, scroll: document.documentElement.scrollWidth, width: innerWidth };
      });
      assert.ok(geometry.nameRight <= geometry.venueRight + 1, JSON.stringify({ locale, width, geometry }));
      assert.ok(geometry.nameRight <= geometry.rateLeft, 'venue and rate must not overlap');
      assert.ok(geometry.scroll <= geometry.width, 'no horizontal page scroll');
    }
  } finally {
    await browser?.close();
    rmSync(profile, { recursive: true, force: true });
  }
});

test('the real client island keeps the same SSR sections through hydration and the first parent update', async () => {
  const client = await createSsrHarness({ clientHome: true });
  const funding = JSON.parse(readFileSync(new URL('./fixtures/funding-rates-live-2026-10-14.json', import.meta.url)));
  const html = await harness.render('https://nexualpha.com/', { funding });
  const document = `<div id="root">${html}</div><script type="application/json" id="nexualpha-prerender-state">${JSON.stringify({pathname:'/',locale:'en',funding})}</script>`;
  let originalSections;
  let observer;
  const removed = [];
  const observingIntersection = class {
    observe() {
      if (originalSections) return;
      originalSections = ['h7-movers','h7-intel','h7-calc','h7-funding'].map(id => window.document.getElementById(id));
      observer = new window.MutationObserver(records => {
        for (const record of records) for (const node of record.removedNodes) {
          if (node.nodeType === 1 && originalSections.some(section => node === section || node.contains(section))) removed.push(node.id || node.className);
        }
      });
      observer.observe(window.document.getElementById('h7-below-root'), {childList:true,subtree:true});
    }
    disconnect() {}
  };
  try {
    const result = await hydrateInJsdom(client.vite, document, 'https://nexualpha.com/', {
      timeoutMs: 10000,
      settleMs: 500,
      until: window => window.document.getElementById('h7-below-root')?.dataset.hydrated === 'true',
      intersectionObserver: observingIntersection,
      inspect: window => ({same:originalSections.map(section => section === window.document.getElementById(section.id)),removed:[...removed],hasController:window.document.getElementById('h7-below-root')?.dataset.hydrated === 'true'}),
    });
    assert.deepEqual(hydrationErrors(result.errors), []);
    assert.ok(originalSections.every(Boolean));
    assert.deepEqual(result.inspected.same, [true,true,true,true]);
    assert.deepEqual(result.inspected.removed, []);
    assert.equal(result.inspected.hasController,true);
  } finally { observer?.disconnect(); await client.close(); }
});
