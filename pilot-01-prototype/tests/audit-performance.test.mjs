import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compactMarketEvents, readLiquidations } from '../src/data/market-data-pages.js';
import { timelineRows } from '../src/data/heatmap-view.js';
import worker from '../worker/index.js';
const feed = JSON.parse(readFileSync(new URL('./fixtures/market-data/market-events.live-v2-2026-10-13.json', import.meta.url)));
test('F13 first-screen projection preserves observed aggregates without coin or seven-day series', () => {
 const large = structuredClone(feed);
 const original = large.liquidations.timeline;
 for (const bucket of original.h24.buckets) bucket.symbols = { BTC: { longUsd: 123, shortUsd: 456 } };
 original.d7 = { buckets: Array.from({length:168}, () => ({symbols:{BTC:'x'.repeat(1000)}})) };
 original.h24.largestBySymbol = { BTC: Array(100).fill({usd:1}) };
 const lean = compactMarketEvents(large, { firstScreen:true });
 assert.deepEqual(readLiquidations(lean), readLiquidations(large));
 assert.deepEqual(timelineRows(lean.liquidations.timeline.h24), timelineRows(original.h24));
 assert.deepEqual(lean.liquidations.timeline.symbols, original.symbols);
 assert.equal(lean.liquidations.timeline.detailsDeferred,true);
 assert.equal(lean.liquidations.timeline.d7,undefined);
 assert.equal(lean.liquidations.timeline.h24.largestBySymbol,undefined);
 assert.ok(lean.liquidations.timeline.h24.buckets.every(b => !('symbols' in b)));
 assert.ok(JSON.stringify(lean).length < JSON.stringify(large).length / 2);
 assert.ok(original.d7, 'projection never mutates collector data');
});
test('F13 summary polling endpoint remains fresh and fails closed', async () => {
 const response = await worker.fetch(new Request('https://nexualpha.com/api/market-events/summary'), { MARKET_EVENTS_READ: async () => feed });
 assert.equal(response.status,200);
 assert.equal(response.headers.get('cache-control'),'no-cache');
 assert.equal((await response.json()).liquidations.timeline.detailsDeferred,true);
 const missing = await worker.fetch(new Request('https://nexualpha.com/api/market-events/summary'), {});
 assert.equal(missing.status,503);
 assert.equal(await missing.json(),null);
});
test('F14 paginated SSR does not preload the entire news fallback archive', () => {
 const source = readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
 assert.ok(!source.includes('href="/content/news-feed-summary.json" as="fetch"'));
});

test('F13 hydration keeps aggregate chart readable and fetches details only after chart interaction', async () => {
 const {createSsrHarness,hydrateInJsdom,hydrationErrors} = await import('./helpers/ssr-hydration-harness.mjs');
 const harness = await createSsrHarness();
 try {
  const marketEvents=compactMarketEvents(feed,{firstScreen:true});
  const app=await harness.render('/liquidations',{marketEvents});
  const state={pathname:'/liquidations',locale:'en',marketEvents};
  const html=`<!doctype html><div id="root">${app}</div><script type="application/json" id="nexualpha-prerender-state">${JSON.stringify(state)}</script>`;
  const requests=[];
  let interacted=false;
  const result=await hydrateInJsdom(harness.vite,html,'https://nexualpha.com/liquidations',{
   timeoutMs:1800,settleMs:20,
   fetchImpl:async input=>{
    const path=String(input?.url || input);requests.push(path);
    return path==='/intel/market-events.json' ? Response.json(feed) : new Response('{}',{status:404});
   },
   until:window=>{
    const control=window.document.querySelector('[data-testid="liquidation-timeline"] select');
    if(control && !interacted){
     assert.ok(!requests.includes('/intel/market-events.json'),'no initial full feed download');
     interacted=true;control.value='d7';control.dispatchEvent(new window.Event('change',{bubbles:true}));
    }
    return requests.includes('/intel/market-events.json');
   },
  });
  assert.ok(interacted);
  assert.ok(requests.includes('/intel/market-events.json'));
  assert.deepEqual(hydrationErrors(result.errors),[]);
 } finally {await harness.close();}
});
