import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { startJsonPolling } from "../src/components/shared/json-polling.js";
import { createVisibilityScheduler } from "../src/components/shared/visibility-scheduler.js";
import { visibilityClock } from "./helpers/visibility-clock.mjs";
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
test("open tabs deduplicate prices, expire on failure, pause hidden and clean up", async () => {
  let effect, states = [], writes = 0, successful = true, requests = 0;
  const clock = visibilityClock(now), scheduler = createVisibilityScheduler(clock), events = new Map();
  const source = (await readFile(new URL("../src/components/tokenized-stocks/tokenized-prices-client.js", import.meta.url), "utf8"))
    .replace(/^import .*;$/gm, "").replaceAll("export ", "");
  const context = {
    useEffect: fn => { effect = fn; },
    useState: initial => { const index = states.length; states.push(initial); return [initial, value => { writes++; states[index] = value; }]; },
    Date: class extends Date { static now() { return clock.now(); } }, Intl,
    document: clock.documentRef,
    window: { addEventListener: (key, fn) => events.set(key, fn), removeEventListener: key => events.delete(key) },
    scheduleVisible: (fn, delay) => scheduler.schedule(fn, delay, { repeat: delay }),
    startJsonPolling: options => startJsonPolling({ ...options, scheduler, documentRef: clock.documentRef,
      now: clock.now, setTimer: clock.setTimer, clearTimer: clock.clearTimer,
      fetchImpl: async () => { requests++; return successful ? Response.json(feed()) : new Response("", { status: 503 }); },
    }),
  };
  vm.createContext(context); vm.runInContext(`${source}\nuseTsPrices();`, context);
  const cleanup = effect(); await clock.advance(0);
  assert.equal(freshTsPrices(states[0], states[1]).length, 1);
  const initialWrites = writes;
  await clock.advance(60000);
  assert.equal(writes, initialWrites, "unchanged quotes do not re-render for polling or expiry checks");
  successful = false;
  await clock.advance(TS_PRICE_MAX_AGE);
  assert.equal(freshTsPrices(states[0], states[1]).length, 0);
  clock.visibility("hidden"); const before = requests;
  await clock.advance(60000); assert.equal(requests, before);
  assert.equal(clock.timers.size, 0);
  clock.visibility("visible"); await clock.advance(0);
  events.get("focus")();
  cleanup(); assert.equal(clock.timers.size, 0); assert.equal(clock.listeners.size, 0); assert.equal(events.size, 0);
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
