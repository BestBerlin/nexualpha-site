import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { freshTsPrices, listedTsPrices, tsPriceGroups, tsHomePriceSummary, tsPriceSummary, sortTsPrices, TS_PRICE_MAX_AGE, tsPriceStamp } from "../src/components/tokenized-stocks/tokenized-prices-client.js";
import { TS_PRICE_COPY } from "../src/components/tokenized-stocks/tokenized-prices-copy.js";
import { tsLive } from "../src/data/tokenized-stocks-rows.js";
import { tsMatrix } from "../src/data/tokenized-stocks-matrix.js";
import { TS_COPY } from "../src/data/tokenized-stocks-copy.js";
const now = Date.parse("2026-10-23T00:10:00Z");
const stamp = new Date(now).toISOString();
const row = { ticker:"NVDA",venueId:"bybit",instrument:"NVDAXUSDT",marketType:"spot",quoteCurrency:"USDT",lastPrice:100,change24hPct:0,quoteVolume24h:1000,indexPrice:100,premiumPct:0,updatedAt:stamp,sourceId:"bybit-spot" };
const feed = (rows = [row]) => ({ updatedAt:stamp,sources:[{id:"bybit-spot",venueId:"bybit",status:"ok",updatedAt:stamp}],rows });
test("expiry, source failures, malformed prices and optional metrics fail closed", () => {
  assert.equal(freshTsPrices(feed(), now).length,1);
  for (const time of [now + TS_PRICE_MAX_AGE, now + TS_PRICE_MAX_AGE + 1, now - 1]) assert.equal(freshTsPrices(feed(),time).length,0);
  for (const patch of [{lastPrice:0},{lastPrice:"100"},{lastPrice:Infinity},{sourceId:"unknown"},{quoteCurrency:""},{quoteCurrency:["USDT"]},{marketType:"future"},{updatedAt:"bad"},{updatedAt:"2020-01-01"}]) assert.equal(freshTsPrices(feed([{...row,...patch}]),now).length,0);
  for (const patch of [{status:"error"},{venueId:"other"},{updatedAt:"2020-01-01"}]) { const f=feed();Object.assign(f.sources[0],patch);assert.equal(freshTsPrices(f,now).length,0); }
  const clean=freshTsPrices(feed([{...row,change24hPct:-101,quoteVolume24h:-1,indexPrice:null,premiumPct:1}]),now)[0];
  assert.equal(clean.change24hPct,null);assert.equal(clean.quoteVolume24h,null);assert.equal(clean.premiumPct,null);
});
test("a separate reference expires without hiding the still-fresh trade", () => {
  const f=feed([{...row,indexSourceId:"index",indexUpdatedAt:"2026-10-22T23:56:00Z"}]);
  f.sources.push({id:"index",venueId:row.venueId,status:"ok",updatedAt:stamp});
  assert.equal(freshTsPrices(f,now)[0].premiumPct,0);
  const result=freshTsPrices({...f,updatedAt:new Date(now+60_000).toISOString()},now+60_000)[0];
  assert.equal(result.lastPrice,100);assert.equal(result.indexPrice,null);assert.equal(result.premiumPct,null);
});
test("listing identity and regional venue universe gate every quote", () => {
  const matrix=[{ticker:"NVDA",by:{bybit:{spot:"NVDAXUSDT"}}}];
  assert.equal(listedTsPrices([row],matrix).length,1);
  for(const patch of [{venueId:"bitget"},{instrument:"NVDAUSDT"},{marketType:"perpetual"},{ticker:"AAPL"}])assert.equal(listedTsPrices([{...row,...patch}],matrix).length,0);
});
test("winners never cross spot/perpetual or quote currencies; missing volume is not zero", () => {
  const rows=[row,{...row,venueId:"kraken",lastPrice:99,quoteVolume24h:2000},{...row,venueId:"gate",lastPrice:98,quoteVolume24h:0},{...row,venueId:"bitget",marketType:"perpetual",lastPrice:1,quoteVolume24h:9000},{...row,venueId:"other",quoteCurrency:"USD",lastPrice:1,quoteVolume24h:9000},{...row,ticker:"AAPL",quoteVolume24h:null}];
  assert.deepEqual(tsPriceGroups(rows),["spot:USDT","spot:USD","perpetual:USDT"]);
  const summaries=tsPriceSummary(rows,"spot:USDT");
  assert.equal(summaries.get("NVDA").price.venueId,"gate");assert.equal(summaries.get("NVDA").volume.venueId,"kraken");assert.equal(summaries.get("AAPL").volume,null);
});
test("numeric sorts retain zero and keep missing values last in either direction", () => {
  const rows=[{ticker:"A"},{ticker:"B"},{ticker:"C"}];
  const summaries=new Map([["A",{price:{change24hPct:0,premiumPct:0}}],["B",{price:{change24hPct:null,premiumPct:null}}],["C",{price:{change24hPct:-1,premiumPct:-1}}]]);
  for(const key of ["change","premium"]) {
    assert.deepEqual(sortTsPrices(rows,summaries,key,"asc").map(r=>r.ticker),["C","A","B"]);
    assert.deepEqual(sortTsPrices(rows,summaries,key,"desc").map(r=>r.ticker),["A","C","B"]);
  }
  assert.equal(tsPriceStamp([row,{...row,updatedAt:"2026-10-23T00:09:00Z"}]),"2026-10-23 00:09:00 +00:00");
});
test("each existing locale has complete price labels and NYSE hours risk copy", () => {
  for(const locale of Object.keys(TS_COPY)) { assert.equal(Object.keys(TS_PRICE_COPY[locale]||{}).length,10,locale);assert.ok(Object.values(TS_PRICE_COPY[locale]).every(Boolean),locale);assert.match(TS_PRICE_COPY[locale].risk,/NYSE|纽约证券交易所|紐約證券交易所/); }
});
test("open tabs refresh, expire on failed requests, resume on focus, and clean up", async () => {
  let effect, states=[], timers=new Map(), events=new Map(), clock=now, id=0, successful=true;
  const source=(await readFile(new URL("../src/components/tokenized-stocks/tokenized-prices-client.js",import.meta.url),"utf8"))
    .replace('import { useEffect, useState } from "react";',"").replaceAll("export ","");
  const context={useEffect:fn=>{effect=fn;},useState:initial=>{const index=states.length;states.push(initial);return [initial,v=>{states[index]=v;}];},Date:class extends Date{static now(){return clock;}},AbortController,Intl,setInterval:fn=>{timers.set(++id,fn);return id;},clearInterval:n=>timers.delete(n),setTimeout:()=>++id,clearTimeout:()=>{},fetch:async()=>({ok:successful,json:async()=>feed()}),window:{addEventListener:(k,fn)=>events.set(k,fn),removeEventListener:k=>events.delete(k)},document:{addEventListener:(k,fn)=>events.set(k,fn),removeEventListener:k=>events.delete(k)}};
  vm.createContext(context);vm.runInContext(`${source}\nuseTsPrices();`,context);
  const cleanup=effect();await new Promise(resolve=>setImmediate(resolve));assert.equal(freshTsPrices(states[0],states[1]).length,1);
  successful=false;clock+=TS_PRICE_MAX_AGE;
  for(const fn of timers.values())fn();await new Promise(resolve=>setImmediate(resolve));assert.equal(freshTsPrices(states[0],states[1]).length,0);
  clock+=10;events.get("focus")();assert.equal(states[1],clock);
  cleanup();assert.equal(timers.size,0);assert.equal(events.size,0);
});

test("explicit alternate token families join the snapshot; unknown or restricted symbols do not", () => {
  const live=tsLive();
  const matrix=tsMatrix({locale:"en",live});
  const alt={...row,ticker:"TSLA",venueId:"mexc",instrument:"TSLAON"};
  assert.equal(listedTsPrices([alt],matrix,live).length,1);
  assert.equal(listedTsPrices([{...alt,instrument:"TSLAUNKNOWN"}],matrix,live).length,0);
  assert.equal(listedTsPrices([alt],matrix.map(r=>({...r,by:{}})),live).length,0);
  const bitget=tsMatrix({locale:"tr",live});
  assert.equal(listedTsPrices([{...row,venueId:"bitget",instrument:"rNVDA"}],bitget,live).length,0);
});
test("home chooses a labeled preferred group per ticker rather than hiding other-market tickers", () => {
  const rows=[row,{...row,ticker:"TSLA",marketType:"perpetual"},{...row,ticker:"AAPL",quoteCurrency:"USD"}];
  const summaries=tsHomePriceSummary(rows);
  assert.equal(summaries.size,3);
  assert.equal(summaries.get("NVDA").price.marketType,"spot");
  assert.equal(summaries.get("TSLA").price.marketType,"perpetual");
  assert.equal(summaries.get("AAPL").price.quoteCurrency,"USD");
});
