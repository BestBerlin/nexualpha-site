import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFunding, createFundingFeed } from '../server/funding-feed.mjs';
import { fundingTable, fundingSnapshot, isFundingSnapshot, FUNDING_SOFT_AGE_MS, FUNDING_MAX_AGE_MS } from '../src/data/funding-rates.js';
const now = Date.UTC(2026, 9, 19);
const rows = [{ symbol: 'BTC', rate: .0001, intervalH: 8 }];
const down = async () => { throw Error('offline'); };
test('funding records first failure and accepts unavailable snapshots', async () => {
 const f = await buildFunding(null, { now, sources: { okx: down } });
 assert.equal(f.status, 'unavailable'); assert.equal(f.venues.okx.error, 'offline'); assert.equal(f.lastAttemptAt, new Date(now).toISOString()); assert.equal(f.lastSuccessAt, null); assert.ok(isFundingSnapshot(f));
});
test('funding retains source truth through partial/total failure, expiry boundaries and recovery', async () => {
 const good = await buildFunding(null, { now, sources: { okx: async () => rows, binance: async () => rows } });
 const partial = await buildFunding(good, { now: now + 1000, sources: { okx: down, binance: async () => rows } });
 assert.equal(partial.venues.okx.readAt, good.venues.okx.readAt); assert.equal(partial.venues.okx.ok, false); assert.equal(fundingTable(partial, 'BTC').find(r => r.venue === 'okx').error, 'offline');
 const fail = await buildFunding(partial, { now: now + 2000, sources: { okx: down, binance: down } });
 assert.equal(fail.ok, false); assert.equal(fail.status, 'stale');
 assert.equal(fundingSnapshot(good, now + FUNDING_SOFT_AGE_MS - 1).status, 'fresh');
 assert.equal(fundingSnapshot(good, now + FUNDING_SOFT_AGE_MS).status, 'stale');
 assert.equal(fundingTable(fundingSnapshot(good, now + FUNDING_MAX_AGE_MS), 'BTC').length, 0);
 const recovered = await buildFunding(fail, { now: now + FUNDING_MAX_AGE_MS, sources: { okx: async () => rows } });
 assert.equal(recovered.status, 'fresh'); assert.equal(recovered.venues.okx.error, null);
});
test('funding cached responses age without a refresh and stopped late results cannot publish', async () => {
 let clock = now; let resolve; let pending = false;
 const feed = createFundingFeed({ enabled: false, now: () => clock, sources: { okx: () => pending ? new Promise(r => { resolve = r; }) : Promise.resolve(rows) } });
 await feed.refresh(); clock += FUNDING_MAX_AGE_MS;
 assert.equal((await (await feed.respond()).json()).status, 'unavailable');
 pending = true; const refresh = feed.refresh(); feed.stop(); resolve(rows); await refresh;
 assert.equal(feed.read().venues.okx.readAt, new Date(now).toISOString());
});

import { buildSync } from 'esbuild';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToString } from 'react-dom/server';
function board() {
 const code = buildSync({ entryPoints: [fileURLToPath(new URL('../src/components/v7/home7-funding.jsx', import.meta.url))], bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic', external: ['react', 'react/jsx-runtime'] }).outputFiles[0].text;
 const mod = { exports: {} }; new Function('module', 'exports', 'require', code)(mod, mod.exports, createRequire(import.meta.url)); return mod.exports.FundingBoard;
}
test('funding SSR stale rows show source time, hard-expired rows show unavailable without ranking', async () => {
 const FundingBoard = board();
 const good = await buildFunding(null, { now, sources: { okx: async () => rows } });
 const stale = { ...good, renderedAt: new Date(now + FUNDING_SOFT_AGE_MS).toISOString() };
 const html = renderToString(React.createElement(FundingBoard, { locale: 'en', initialFeed: stale }));
 assert.match(html, /Stale/); assert.doesNotMatch(html, /h7-fr-row best/); assert.match(html, /0.0100%/);
 assert.equal(renderToString(React.createElement(FundingBoard, { locale: 'en', initialFeed: stale })), html, 'first render uses only the serialized clock');
 const expired = renderToString(React.createElement(FundingBoard, { locale: 'en', initialFeed: { ...good, renderedAt: new Date(now + FUNDING_MAX_AGE_MS).toISOString() } }));
 assert.match(expired, /Unavailable/); assert.doesNotMatch(expired, /role="row"/);
});

test('funding worker SSR accepts unavailable empty cache and serializes the same seed', async () => {
 const [{ default: worker }, { createSsrHarness, prerenderState, SHELL_HTML }] = await Promise.all([import('../worker/index.js'), import('./helpers/ssr-hydration-harness.mjs')]);
 const harness = await createSsrHarness();
 const unavailable = await buildFunding(null, { sources: { okx: down } });
 const assets = { fetch: async request => {
  const path = new URL(request.url).pathname;
  if (path === '/prerender-manifest.json') return Response.json({ version: 'nexualpha-prerender-v1', routes: { '/|en': { pathname: '/', locale: 'en', html: harness.render('/'), searchPublished: true } } });
  if (path === '/index.html') return new Response(SHELL_HTML, { headers: { 'content-type': 'text/html' } });
  return new Response('missing', { status: 404 });
 } };
 try {
  const response = await worker.fetch(new Request('https://nexualpha.com/'), { ASSETS: assets, NEWS_SSR_RENDER: harness.render, FUNDING_READ: () => unavailable });
  assert.equal(response.status, 200);
  const html = await response.text();
  const seed = prerenderState(html).funding;
  assert.equal(seed.status, 'unavailable');
  assert.deepEqual(seed.venues, unavailable.venues);
  assert.match(html, /id="h7-funding"/);
  assert.match(html, /Unavailable/);
  assert.doesNotMatch(html, /h7-fr-row best/);
 } finally { await harness.close(); }
});
