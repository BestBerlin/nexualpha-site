import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as exchange from './exchange.mjs';
import * as legal from './legal.mjs';
import * as feeds from './feeds.mjs';
import * as social from './social.mjs';
import {normalizeItem} from './common.mjs';
import {readSourceRegistry} from '../db/generate-seed-sql.mjs';
const recorded=(name,json=true)=>{const text=readFileSync(new URL(`./fixtures/recorded/${name}`,import.meta.url),'utf8');return json?JSON.parse(text):text;};
const registry=readSourceRegistry();
const source=id=>registry.find(s=>s.id===id);
const now=new Date('2026-10-13T00:00:00Z');
const ctx={now,entities:[],keywords:[],config:{},env:{}};
test('recorded exchange responses retain real announcement IDs and URLs',async()=>{
 for(const [id,name] of [['okx-announcements','okx.json'],['bybit-announcements','bybit.json'],['bitget-announcements','bitget.json'],['kraken-status','kraken.json']]){
  const s=source(id);const rows=await exchange.poll(s,null,{...ctx,request:async()=>recorded(name)});
  assert.ok(rows.length>0,id);for(const row of rows){const item=normalizeItem(row,s,{now});assert.ok(item.external_id);assert.match(item.url,/^https:/);}
 }
});
test('recorded regulator, court and EDGAR responses parse without live requests',async()=>{
 for(const [id,name,json] of [['sec-press','sec.xml',false],['courtlistener-search','courtlistener.json',true],['sec-edgar-full-text','edgar.json',true]]){
  const rows=await legal.poll(source(id),null,{...ctx,request:async()=>recorded(name,json)});assert.equal(rows.length,2,id);
 }
});
test('recorded media and Trends samples are accepted by the shared feed parser',()=>{
 for(const name of ['media.xml','trends.xml']){const rows=feeds.parseFeed(recorded(name,false));assert.equal(rows.length,2);assert.ok(rows[0].title);}
});
test('recorded X search response is metadata preserving under a fixture-only budget',async()=>{
 const rows=await social.poll(source('x-api-v2'),null,{...ctx,entities:[{id:'binance',status:'active',accounts:{x:'binance'}}],keywords:[{term:'hacked',status:'active'}],config:{x_daily_read_budget:10},env:{X_BEARER_TOKEN:'fixture'},reserve:async()=>true,request:async()=>recorded('x.json')});
 assert.ok(rows.length>0);assert.ok(rows[0].external_id);assert.ok(rows[0].metrics);
});
