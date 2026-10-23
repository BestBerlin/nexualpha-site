import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { transformSync } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TS_TICKERS_ALL } from '../src/data/tokenized-stocks-routes.js';
import { STOCK_LOGOS, STOCK_LOGO_FALLBACKS } from '../src/components/tokenized-stocks/stock-logo-manifest.js';

// Compile the actual JSX without opening a server or replacing component behavior.
const source = readFileSync(new URL('../src/components/tokenized-stocks/StockLogo.jsx', import.meta.url), 'utf8');
const js = transformSync(source.replace('"./stock-logo-manifest.js"', JSON.stringify(new URL('../src/components/tokenized-stocks/stock-logo-manifest.js', import.meta.url).href)), { loader: 'jsx', format: 'esm' }).code;
const { StockLogo } = await import(`data:text/javascript,${encodeURIComponent(js.replace('from "react"', `from ${JSON.stringify(new URL('../node_modules/react/index.js', import.meta.url).href)}`))}`);

test('all 30 tickers have a local asset or an explicit fallback reason', () => {
  assert.equal(TS_TICKERS_ALL.length, 30);
  for (const ticker of TS_TICKERS_ALL) {
    assert.ok(STOCK_LOGOS[ticker] || STOCK_LOGO_FALLBACKS[ticker], ticker);
    if (!STOCK_LOGOS[ticker]) assert.ok(STOCK_LOGO_FALLBACKS[ticker].length > 15, ticker);
  }
});
test('assets are normalized, <= 2KB, and render images with company alt and stable dimensions', () => {
  for (const [ticker, logo] of Object.entries(STOCK_LOGOS)) {
    const svg = readFileSync(new URL(`../public${logo.src}`, import.meta.url));
    assert.ok(svg.length <= 2048, `${ticker}: ${svg.length}`);
    assert.match(svg.toString(), /viewBox="0 0 32 32"/);
    const html = renderToStaticMarkup(React.createElement(StockLogo, { ticker, size: 40 }));
    assert.match(html, /<img /);
    assert.ok(html.includes(`alt="${logo.name.replaceAll('&', '&amp;')}"`), html);
    assert.match(html, /width="40" height="40" loading="lazy"/);
  }
});
test('top twelve never render a monogram; unknown tickers retain an accessible fallback', () => {
  for (const ticker of TS_TICKERS_ALL.slice(0, 12)) assert.match(renderToStaticMarkup(React.createElement(StockLogo, { ticker })), /<img /);
  assert.match(renderToStaticMarkup(React.createElement(StockLogo, { ticker: 'UNKNOWN' })), /role="img" aria-label="UNKNOWN"/);
  assert.match(renderToStaticMarkup(React.createElement(StockLogo, { ticker: 'AAPL', loading: 'eager' })), /loading="eager"/);
});
