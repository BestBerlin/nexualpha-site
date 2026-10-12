import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {poll,xQueries} from './social.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/social.json',import.meta.url)));
function context(extra={}) {
  let used=0;const requests=[];
  return {entities:[{id:'binance',status:'active',accounts:{x:'binance',youtube:'@BinanceYoutube'}}],keywords:[{term:'withdrawals suspended',status:'active',lang:'en'}],env:{X_BEARER_TOKEN:'fixture-token',YOUTUBE_API_KEY:'fixture-key'},config:{x_daily_read_budget:10},now:new Date('2026-10-12T12:00:00Z'),
    reserve:async(_,amount,cap)=>{if(used+amount>cap)return false;used+=amount;return true;},
    request:async(url,opts)=>{requests.push({url,opts});return url.includes('/channels')?fixture.channel:url.includes('youtube')?fixture.youtube:fixture.x;},requests,...extra};
}
test('X defaults to disabled before dispatch and missing token is distinct',async()=>{
  const ctx=context({config:{}});await assert.rejects(poll({id:'x-api-v2'},null,ctx),/disabled/);assert.equal(ctx.requests.length,0);
  await assert.rejects(poll({id:'x-api-v2'},null,context({env:{}})),/token missing/);
});
test('X requests reserve ten reads, retain author metrics and never retry paid reads',async()=>{
  const ctx=context();const items=await poll({id:'x-api-v2'},null,ctx);
  assert.equal(items[0].author_account,'binance');assert.equal(items[0].metrics.like_count,12);assert.equal(ctx.requests[0].opts.retry,false);
  assert.match(new URL(ctx.requests[0].url).searchParams.get('query'),/from:binance/);
  await assert.rejects(poll({id:'x-api-v2'},null,ctx),/exhausted/);assert.equal(ctx.requests.length,1);
});
test('X incomplete payload fails and a failed request retains its reservation',async()=>{
  const ctx=context({request:async()=>{throw new Error('fixture failure');}});
  await assert.rejects(poll({id:'x-api-v2'},null,ctx),/fixture failure/);
  await assert.rejects(poll({id:'x-api-v2'},null,ctx),/exhausted/);
  await assert.rejects(poll({id:'x-api-v2'},null,context({request:async()=>({errors:[{}]})})),/incomplete/);
});
test('account placeholders are never inserted into X queries',()=>{
  assert.deepEqual(xQueries([{status:'active',accounts:{x:'unverified - via @Fed'}}],[{status:'active',term:'hacked'}]),[]);
});
test('YouTube resolves handles, caps quota and emits metadata only',async()=>{
  const ctx=context({config:{youtube_daily_unit_budget:101}});
  const items=await poll({id:'youtube-data-api'},null,ctx);
  assert.equal(items.length,1);assert.equal(items[0].metrics.metadata_only,true);assert.equal(items[0].metrics.captions_available,false);assert.equal(items[0].body_excerpt,undefined);
  assert.equal(ctx.requests.length,2);
  const empty=context({config:{youtube_daily_unit_budget:0}});
  assert.deepEqual(await poll({id:'youtube-data-api'},null,empty),[]);assert.match(empty.partial,/quota/);assert.equal(empty.requests.length,0);
});
test('YouTube supports injected read OAuth access token without putting it in URL',async()=>{
  const ctx=context({env:{YOUTUBE_ACCESS_TOKEN:'fixture-oauth'}});await poll({id:'youtube-data-api'},null,ctx);
  assert.equal(new URL(ctx.requests[0].url).searchParams.has('key'),false);assert.equal(ctx.requests[0].opts.headers.Authorization,'Bearer fixture-oauth');
});
