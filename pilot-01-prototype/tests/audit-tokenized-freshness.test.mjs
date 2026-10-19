import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, unlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTokenizedStocksReader } from '../server/tokenized-stocks-feed.mjs';

test('F08 missing, corrupt, older, expired snapshots degrade compact/full together and recover', async () => {
 const dir = await mkdtemp(join(tmpdir(), 'nx-stock-'));
 const file = join(dir, 'snapshot.json');
 let time = Date.parse('2026-10-19T00:00:00Z');
 const snapshot = (at = time) => ({ schema: 1, generatedAt: new Date(at).toISOString(), venues: { binance: { spot: { checkedAt: new Date(at).toISOString(), items: Object.fromEntries(Array.from({length:200}, (_,i)=>[i ? `X${i}` : 'NVDA', {sym:`X${i}`}])) } } } });
 const reader = createTokenizedStocksReader({file, ttlMs: 10, maxAgeMs: 100, hardMaxAgeMs: 200, now: () => time});
 const check = async (status) => { const compact = await reader.read(); const full = await (await reader.respond()).json(); assert.equal(compact.status,status); assert.equal(full.status,status); assert.equal(compact.stale, status !== 'OK'); assert.equal(compact.lastAttemptAt, full.lastAttemptAt); return compact; };
 try {
 await writeFile(file, JSON.stringify(snapshot())); await check('OK');
 await unlink(file); time += 10; await check('DEGRADED');
 await writeFile(file, '{'); time += 10; await check('DEGRADED');
 await writeFile(file, JSON.stringify(snapshot(time-30))); time += 10; await check('DEGRADED');
 await writeFile(file, JSON.stringify(snapshot())); time += 10; await check('OK');
 time += 100; await check('STALE'); time += 100; const expired = await check('UNAVAILABLE'); assert.deepEqual(expired.rows, {});
 await writeFile(file, JSON.stringify(snapshot())); time += 10; await check('OK');
 } finally { await rm(dir, {recursive:true, force:true}); }
});

test('F08 cold missing file is explicit unavailable, never static fallback', async () => {
 const reader = createTokenizedStocksReader({file:join(tmpdir(),'nx-never-existing-snapshot.json')});
 assert.equal((await reader.read()).status,'UNAVAILABLE');
 assert.equal((await (await reader.respond()).json()).status,'UNAVAILABLE');
});

test('F08 unavailable runtime state cannot fall back to baked current listings', async () => {
 const {tsLive, tsExchangeTickerRows} = await import('../src/data/tokenized-stocks-rows.js');
 const unavailable = {status:'UNAVAILABLE', stale:true, generatedAt:null, rows:{}, counts:{}, checked:{}};
 assert.equal(tsLive(unavailable),unavailable);
 assert.deepEqual(tsExchangeTickerRows('binance',['NVDA'], unavailable),[]);
});

test('F08 worker SSR carries cold unavailable runtime data through HTML and hydration state without baked listings', async () => {
 const [{ default: worker }, { createSsrHarness, SHELL_HTML }, { tsExchangeTickerRows }] = await Promise.all([
  import('../worker/index.js'), import('./helpers/ssr-hydration-harness.mjs'), import('../src/data/tokenized-stocks-rows.js'),
 ]);
 const harness = await createSsrHarness();
 const reader = createTokenizedStocksReader({ file: join(tmpdir(), 'nx-never-existing-worker-snapshot.json') });
 const assets = { fetch: async request => {
  const path = new URL(request.url).pathname;
  if (path === '/prerender-manifest.json') return Response.json({ version: 'nexualpha-prerender-v1', routes: {} });
  if (path === '/index.html') return new Response(SHELL_HTML, { headers: { 'content-type': 'text/html' } });
  return new Response('missing', { status: 404 });
 } };
 try {
  let rendererState;
  const response = await worker.fetch(new Request('https://nexualpha.com/tokenized-stocks/nvda', { headers: { accept: 'text/html' } }), {
   ASSETS: assets, TS_LIVE_READ: reader.read,
   NEWS_SSR_RENDER: (href, options) => { rendererState = options; return harness.render(href, options); },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  const stateMatch = html.match(/<script type="application\/json" id="nexualpha-prerender-state">([\s\S]*?)<\/script>/);
  assert.ok(stateMatch, 'worker writes a hydration seed');
  const state = JSON.parse(stateMatch[1]);
  assert.equal(state.tsLive.status, 'UNAVAILABLE');
  assert.equal(state.tsLive.generatedAt, null);
  assert.deepEqual(state.tsLive.rows, {});
  assert.deepEqual(tsExchangeTickerRows('binance', ['NVDA'], state.tsLive), []);
  assert.ok(rendererState, 'the route was rendered rather than served as static HTML');
  const main = (html.match(/<main\b[^>]*class="nxts[\s\S]*<\/main>/) || [''])[0];
  assert.ok(main, 'SSR main exists');
  assert.doesNotMatch(main, /href="\/exchanges\/(?:binance|bitget|okx|bybit|gate-io|mexc|kraken)"/, 'baked live exchange rows must not return');
  assert.match(main, /href="\/exchanges\/coinw"/, 'independently sourced fact venues remain available');
 } finally { await harness.close(); }
});
