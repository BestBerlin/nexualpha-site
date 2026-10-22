import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";
import { TS_COPY } from "../src/data/tokenized-stocks-copy.js";
import { tsMatrix } from "../src/data/tokenized-stocks-matrix.js";
import { tsVenues } from "../src/data/tokenized-stocks.js";
const require=createRequire(import.meta.url);
const result=await build({stdin:{contents:'export {StockMatrix,RiskList} from "./src/components/tokenized-stocks/TokenizedStocksMatrix.jsx";export {HomeTokenizedStrip} from "./src/components/tokenized-stocks/HomeTokenizedStrip.jsx";',resolveDir:fileURLToPath(new URL("../",import.meta.url)),loader:"js"},bundle:true,write:false,format:"cjs",platform:"node",external:["react"],loader:{".css":"empty"},plugins:[{name:"inject-price-hook",setup(builder){builder.onLoad({filter:/tokenized-prices-client\.js$/},async ({path})=>({contents:(await fs.readFile(path,"utf8")).replace(/export function useTsPrices\([^)]*\)/, "function originalUseTsPrices()")+'\nexport const useTsPrices = () => globalThis.__tsPrices || [];',loader:"js"}));}}]});
const module={exports:{}};
const scope={module,exports:module.exports,require,console,URL,URLSearchParams,__tsPrices:[]};
vm.runInNewContext(result.outputFiles[0].text,scope);
const {StockMatrix,RiskList,HomeTokenizedStrip}=module.exports;
const render=(Type,props)=>renderToStaticMarkup(React.createElement(Type,props));
const props={t:TS_COPY.en,locale:"en",venues:tsVenues("en")};
const matrix=tsMatrix({locale:"en"});
function quote(ticker,venueId,instrument,marketType="spot",quoteCurrency="USDT",patch={}) {return {ticker,venueId,instrument,marketType,quoteCurrency,lastPrice:123.45,change24hPct:2.25,quoteVolume24h:123456,indexPrice:123,premiumPct:0.36,updatedAt:"2026-10-23T00:10:00Z",...patch};}
const nvda=matrix.find(r=>r.ticker==="NVDA");
const [venueId,lanes]=Object.entries(nvda.by).find(([id,l])=>l.spot && props.venues.slice(0,6).some(v=>v.slug===id));
const fixture=quote("NVDA",venueId,lanes.spot);
test("missing feeds preserve directory and home listings without live columns or timestamps",()=>{
 scope.__tsPrices=[];
 const hub=render(StockMatrix,props),home=render(HomeTokenizedStrip,{locale:"en"});
 assert.doesNotMatch(hub,/Last price|Highest volume|Prices as of|Market \/ quote/);
 assert.doesNotMatch(home,/h7-ts-price|Prices as of/);
 assert.match(hub,/NVDA/);assert.match(home,/NVDA/);
});
test("live hub renders sortable metrics, identifies currency/instrument and presents only allowed groups",()=>{
 scope.__tsPrices=[fixture,quote("NVDA","unknown","BAD","spot","USD"),quote("NVDA",venueId,lanes.spot,"spot","USD")];
 const hub=render(StockMatrix,props);
 for(const label of ["Last price","24h change","24h quote volume","Premium / discount","Lowest last price","Highest volume"])assert.ok(hub.includes(`Sort by ${label}`),label);
 assert.match(hub,/123\.45 USDT/);assert.match(hub,/\+2\.25%/);assert.match(hub,/\+0\.36%/);assert.match(hub,/2026-10-23 00:10:00 \+00:00/);
 assert.ok(hub.includes(lanes.spot));assert.match(hub,/Stock tokens · USDT/);assert.match(hub,/Stock tokens · USD/);assert.doesNotMatch(hub,/BAD|unknown/);
});
test("home cards show price/change and its venue, quote and product (owner 2026-10-23: six stock cards)",()=>{
 scope.__tsPrices=[fixture];
 const home=render(HomeTokenizedStrip,{locale:"en"});
 assert.match(home,/h7-tsc-price/);assert.match(home,/123\.45<\/b> <small>USDT/);assert.match(home,/\+2\.25%/);assert.match(home,/Stock tokens/);assert.match(home,/Prices as of/);
 assert.equal((home.match(/class="h7-tsc"/g)||[]).length,6);
 // Cards without a fresh price show listing info only, never a placeholder price.
 assert.match(home,/data-empty=""><b>\d+ listed<\/b>/);
});
test("risk remains five existing items with localized NYSE hours explanation",()=>{
 for(const [locale,t]of Object.entries(TS_COPY)) {const html=render(RiskList,{t});assert.equal((html.match(/<li>/g)||[]).length,5,locale);assert.match(html,/NYSE|纽约证券交易所|紐約證券交易所/);}
});
test("hub interactions sort both directions, switch quote currency, and remove missing-feed columns",async()=>{
 const {JSDOM}=await import("jsdom");
 const dom=new JSDOM('<div id="root"></div>',{url:"https://nexualpha.example/tokenized-stocks"});
 const oldWindow=globalThis.window,oldDocument=globalThis.document,oldAct=globalThis.IS_REACT_ACT_ENVIRONMENT;
 globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const {createRoot}=await import("react-dom/client");
 const root=createRoot(dom.window.document.getElementById("root"));
 try {
   const tsla=matrix.find(r=>r.ticker==="TSLA");
   const [secondVenue,secondLanes]=Object.entries(tsla.by).find(([,l])=>l.spot);
   scope.__tsPrices=[fixture,quote("TSLA",secondVenue,secondLanes.spot,"spot","USDT",{lastPrice:1}),quote("NVDA",venueId,lanes.spot,"spot","USD",{lastPrice:12})];
   await React.act(async()=>root.render(React.createElement(StockMatrix,props)));
   const button=dom.window.document.querySelector('button[aria-label="Sort by Last price"]');
   await React.act(async()=>button.click());
   assert.match(dom.window.document.querySelector("tbody tr th").textContent,/TSLA/);
   await React.act(async()=>button.click());
   assert.match(dom.window.document.querySelector("tbody tr th").textContent,/NVDA/);
   const select=dom.window.document.querySelector("select");
   await React.act(async()=>{select.value="spot:USD";select.dispatchEvent(new dom.window.Event("change",{bubbles:true}));});
   assert.match(dom.window.document.querySelector("tbody tr td").textContent,/12 USD/);
   scope.__tsPrices=[];
   await React.act(async()=>root.render(React.createElement(StockMatrix,{...props})));
   assert.equal(dom.window.document.querySelector("select"),null);
   assert.equal(dom.window.document.querySelector('button[aria-label="Sort by Last price"]'),null);
 }finally{
   await React.act(async()=>root.unmount());dom.window.close();globalThis.window=oldWindow;globalThis.document=oldDocument;globalThis.IS_REACT_ACT_ENVIRONMENT=oldAct;
 }
});
