import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { createSsrHarness } from './helpers/ssr-hydration-harness.mjs';

test('home exposes native funding cells, links and a single accessible rebate amount', async () => {
  const harness = await createSsrHarness();
  try {
    const generatedAt = new Date().toISOString();
    const html = harness.render('/', { funding: { generatedAt, venues: { binance: { ok: true, readAt: generatedAt, rows: [{ symbol: 'BTC', rate: .0001, intervalH: 8, nextAt: generatedAt }] } } } });
    const document = new JSDOM(html).window.document;
    const table = document.querySelector('table.h7-fr-table');
    assert.ok(table);
    assert.equal(table.querySelectorAll('thead th[scope="col"]').length, 4);
    assert.equal(table.querySelectorAll('tbody tr td').length, 4);
    assert.ok(table.querySelector('tbody td a[href="/exchanges/binance"]'));
    assert.equal(document.querySelectorAll('a[role="row"]').length, 0);
    const amount = document.querySelector('.hx-rate-num');
    assert.ok(amount);
    assert.equal(amount.hasAttribute('aria-label'), false);
    assert.equal(amount.textContent, '$3,600');
    assert.equal(amount.querySelectorAll('.h7-sr').length, 0);
    assert.ok(document.querySelector('h1 .hx-say-vol')?.textContent.trim());
    assert.ok(document.querySelector('h1 .hx-say-venue')?.textContent.trim());
    assert.equal(amount.querySelectorAll('.hx-rate-pct[aria-hidden], .hx-rate-n[aria-hidden], .hx-rate-u[aria-hidden]').length, 0);
  } finally { await harness.close(); }
});

test('compare region names describe unique purposes and liquidation stats keep a level-two outline', async () => {
  const harness = await createSsrHarness();
  try {
    const document = new JSDOM(harness.render('/compare')).window.document;
    const names = [...document.querySelectorAll('[aria-label][role="region"], section[aria-labelledby]')].map((node) => node.getAttribute('aria-label') || document.getElementById(node.getAttribute('aria-labelledby'))?.textContent).filter(Boolean);
    assert.ok(names.length >= 10);
    assert.equal(new Set(names).size, names.length);
  } finally { await harness.close(); }
  assert.match(readFileSync('src/components/data/LiquidationsPage.jsx', 'utf8'), /<h2>\{label\}<\/h2>/);
});

test('campaign summary shared color has contrast headroom without opacity dilution', () => {
  const css = readFileSync('src/components/shared/campaign-brief-facts.css', 'utf8');
  assert.match(css, /--campaign-summary-ink,#92979f/);
  assert.match(css, /campaign-brief-summary\{[^}]*opacity:1/);
  const luminance = (hex) => hex.match(/../g).map((c) => parseInt(c, 16) / 255).map((c) => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
  assert.ok((luminance('92979f') + .05) / (luminance('08090c') + .05) >= 4.7);
});
