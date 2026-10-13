import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { heatmapCopy, heatmapSchemas } from '../src/data/heatmap-copy.js';
import { heatmapPartnerHref, timelineRows } from '../src/data/heatmap-view.js';
import { DATA_PAGE_LOCALES, LIQUIDATION_HEATMAP_PATH } from '../src/data/market-data-pages.js';
import { localizedPath } from '../src/data/locale-routing.js';
import { createGoRedirect } from '../server/go-redirect.mjs';
import worker, { renderLocaleSitemap, routeMetadata } from '../worker/index.js';

test('heatmap route copy and schemas cover every locale', () => {
 for (const locale of DATA_PAGE_LOCALES) {
  const c = heatmapCopy(locale); assert.ok(c.title && c.levels && c.model);
  if (locale !== 'en') assert.notEqual(c.title, heatmapCopy('en').title);
  assert.equal(heatmapSchemas(locale)[0].inLanguage,locale);
  assert.match(heatmapSchemas(locale)[0].url,/\/liquidations\/heatmap$/);
 }
 assert.equal(heatmapPartnerHref('okx','zh-Hans'),'/go/okx?src=liq-heatmap&locale=zh-Hans');
 assert.equal(localizedPath(LIQUIDATION_HEATMAP_PATH, 'zh-Hans'), '/zh-hans/liquidations/heatmap');
});
test('heatmap redirects enforce territorial gates without counting blocked clicks', async () => {
 const dir = await mkdtemp(path.join(tmpdir(),'liq-go-'));
 try {
  await mkdir(path.join(dir,'intel')); await writeFile(path.join(dir,'intel/partners.json'),JSON.stringify({partners:[{slug:'okx',registrationUrl:'https://www.okx.com/join/nexu888'}]}));
  const handle = createGoRedirect({clientRoot:dir});
  assert.equal((await handle(new Request('https://nexualpha.com'+heatmapPartnerHref('okx','ja')))).status,403);
  assert.equal((await handle(new Request('https://nexualpha.com'+heatmapPartnerHref('okx','en'),{headers:{'cf-ipcountry':'JP'}}))).status,403);
  const allowed = await handle(new Request('https://nexualpha.com'+heatmapPartnerHref('okx','en'),{headers:{'cf-ipcountry':'TR'}}));
  assert.equal(allowed.status,302); assert.equal(allowed.headers.get('location'),'https://www.okx.com/join/nexu888');
 } finally { await rm(dir,{recursive:true,force:true}); }
});

test('SSR en and zh-hans retain recorded summary, largest order and estimated levels', async () => {
 const project = path.resolve(import.meta.dirname,'..');
 const dir = await mkdtemp(path.join(project,'tests/.tmp-liq-heatmap-'));
 try {
  const entry = path.join(dir,'entry.mjs'), bundle=path.join(dir,'bundle.cjs');
  await writeFile(entry, `
   import React from 'react';
   import {renderToStaticMarkup} from 'react-dom/server';
   import {LiquidationHeatmapPage} from '../../src/components/data/LiquidationHeatmapPage.jsx';
   import {buildLiquidationTimeline} from '../../../ops/market-collector/market-collector.mjs';
   import {estimateLiquidationLevels} from '../../src/data/liquidation-levels.js';
   const now=Date.parse('2026-10-13T12:00:00Z');
   const feed={generatedAt:new Date(now).toISOString(),liquidations:{timeline:buildLiquidationTimeline([{t:now-300000,s:'BTCUSDT',side:'long',usd:123456},{t:now-600000,s:'ETHUSDT',side:'short',usd:50000}],[],now)}};
   const legacyFeed={generatedAt:new Date(now).toISOString(),liquidations:{timeline:{symbols:['BTC'],coverage:{label:'Binance + OKX observed liquidations',venueCount:2},h24:{bucketMs:300000,buckets:[{t:now-300000,start:new Date(now-300000).toISOString(),observed:true,longUsd:0,shortUsd:200,symbols:{BTC:{longUsd:0,shortUsd:200}}}],largest:[{symbol:'BTC',venue:'OKX',side:'short',usd:200,at:new Date(now-300000).toISOString()}],largestBySymbol:{BTC:[{symbol:'BTC',venue:'OKX',side:'short',usd:200,at:new Date(now-300000).toISOString()}]}},d7:{bucketMs:3600000,buckets:[],largest:[]}}}};
   const levels={generatedAt:new Date(now).toISOString(),symbols:[estimateLiquidationLevels({symbol:'BTC',price:60000,openInterestUsd:1000000})]};
   const out=Object.fromEntries(['en','zh-Hans','ja','ar'].map(locale=>[locale,renderToStaticMarkup(React.createElement(LiquidationHeatmapPage,{locale,initialFeed:feed,initialLevels:levels}))]));
   out.legacy=renderToStaticMarkup(React.createElement(LiquidationHeatmapPage,{locale:'en',initialFeed:legacyFeed,initialLevels:levels}));
   console.log(JSON.stringify(out));
  `);
  execFileSync(path.join(project,'node_modules/.bin/esbuild'),[entry,'--bundle','--platform=node','--format=cjs',`--outfile=${bundle}`,'--loader:.css=empty','--log-level=error']);
  const out = JSON.parse(execFileSync('node',[bundle],{encoding:'utf8'}));
  for(const locale of ['en','zh-Hans']) {
   assert.ok(out[locale].includes('$123,456') && out[locale].includes('$50,000'));
   assert.match(out[locale],/<canvas/); assert.match(out[locale],/71%/);
   assert.ok(out[locale].includes(heatmapCopy(locale).levels));
   assert.match(out[locale],/src=liq-heatmap/);
   assert.match(out[locale],/academy\/what-leverage-does/);
   assert.match(out[locale],/academy\/liquidation-mark-price/);
   assert.doesNotMatch(out[locale],/NaN|Infinity|undefined/);
  }
  assert.match(out['zh-Hans'],/清算热力图/);
  assert.match(out.ar,/<main[^>]+dir="rtl"/);
  assert.doesNotMatch(out.ja,/\/go\/okx\?/);
  assert.match(out.legacy, /OKX observed liquidations/);
  assert.doesNotMatch(out.legacy, /Binance USDT-M \+ OKX/);
 } finally { await rm(dir,{recursive:true,force:true}); }
});


test('symbol filtering keeps recorded sides and leaves absent symbols at zero', () => {
 const w = {bucketMs:300000,buckets:[{t:0,start:'2026-10-13T12:00:00Z',observed:true,longUsd:10,shortUsd:20,symbols:{BTC:{longUsd:10,shortUsd:0},ETH:{longUsd:0,shortUsd:20}}}]};
 assert.equal(timelineRows(w,'BTC')[0].longUsd,10);
 assert.equal(timelineRows(w,'BTC')[0].shortUsd,0);
 assert.equal(timelineRows(w,'ETH')[0].shortUsd,20);
 assert.equal(timelineRows(w)[0].shortUsd,20);
 assert.equal(timelineRows(w,'SOL')[0].longUsd,0);
 assert.equal(timelineRows(w)[0].label,'20:00'); // 12:00 UTC is 20:00 SGT
});

test('worker routes heatmap SEO, SSR hydration, API, and sitemap through cached feed readers', async () => {
 const shell = '<!doctype html><html lang="en"><head><title>Base</title><meta name="description" content="Base"></head><body><div id="root"></div></body></html>';
 const assets = { async fetch(request) {
  return new URL(request.url).pathname === '/index.html'
   ? new Response(shell, { headers: { 'content-type': 'text/html; charset=utf-8' } })
   : new Response('missing', { status: 404 });
 }};
 const feed = { generatedAt:'2026-10-13T12:00:00.000Z', liquidations:{ timeline:{ h24:{ buckets:[], symbols:[], largest:[] }, d7:{ buckets:[], symbols:[], largest:[] }, coverage:{} } } };
 const levels = { generatedAt:'2026-10-13T12:00:00.000Z', symbols:[{ symbol:'BTC', price:60000, openInterestUsd:1000000, exchanges:[{venue:'binance'}], levels:[{side:'long', leverage:25, price:58000, usd:125000}] }] };
 const calls = [];
 const env = {
  ASSETS: assets,
  MARKET_EVENTS_READ: async () => feed,
  LIQUIDATION_LEVELS_READ: async () => levels,
  NEWS_SSR_RENDER: async (href, options) => {
   calls.push({ href, options });
   return `<main class="v6 v2-page v3-page nxd" data-testid="liquidation-heatmap-page"><header class="nxd-hero"><h1>${heatmapCopy('zh-Hans').title}</h1></header></main>`;
  },
 };
 const meta = await routeMetadata(new URL('https://nexualpha.com/zh-hans/liquidations/heatmap'), env);
 assert.equal(meta.status, 200);
 assert.equal(meta.canonical, 'https://nexualpha.com/zh-hans/liquidations/heatmap');
 assert.equal(meta.robots, 'index,follow');
 assert.equal(meta.schema[0]['@type'], 'WebPage');
 assert.equal((await routeMetadata(new URL('https://nexualpha.com/ur/liquidations/heatmap'), env)).robots, 'noindex,follow');

 const response = await worker.fetch(new Request('https://nexualpha.com/zh-hans/liquidations/heatmap', { headers: { accept:'text/html' } }), env);
 const html = await response.text();
 assert.equal(response.status, 200);
 assert.equal(response.headers.get('cache-control'), 'no-store');
 assert.equal(calls.length, 1);
 assert.equal(calls[0].options.marketEvents.generatedAt, feed.generatedAt);
 assert.equal(calls[0].options.liquidationLevels.generatedAt, levels.generatedAt);
 const state = JSON.parse(html.match(/<script type="application\/json" id="nexualpha-prerender-state">([\s\S]*?)<\/script>/)[1]);
 assert.equal(state.pathname, LIQUIDATION_HEATMAP_PATH);
 assert.equal(state.locale, 'zh-Hans');
 assert.equal(state.marketEvents.generatedAt, feed.generatedAt);
 assert.equal(state.liquidationLevels.symbols[0].symbol, 'BTC');

 const api = await worker.fetch(new Request('https://nexualpha.com/api/liquidation-levels'), env);
 assert.equal(api.status, 200);
 assert.equal(api.headers.get('cache-control'), 'no-store');
 assert.equal((await api.json()).symbols[0].symbol, 'BTC');
 const xml = await renderLocaleSitemap(env);
 assert.match(xml, /<loc>https:\/\/nexualpha\.com\/liquidations\/heatmap<\/loc>/);
 assert.match(xml, /<loc>https:\/\/nexualpha\.com\/zh-hans\/liquidations\/heatmap<\/loc>/);
});
