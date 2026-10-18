import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createSsrHarness, hydrateInJsdom } from "./helpers/ssr-hydration-harness.mjs";
import { whaleSignalBucket, whaleCoinPath } from "../src/data/whale-routes.js";
import { normalizeWhales } from "../src/data/radar.js";
import { radarRouteSeo } from "../src/data/radar-seo.js";
import { routeInventory, buildSitemap } from "../scripts/generate-prerender-manifest.mjs";
import { routeMetadata } from "../worker/index.js";

const snapshot = { status: "ok", updatedAt: "2026-10-15T00:00:00Z", rows: [
  { id: "a", category: "signal", coin: "HYPE", signalType: "accumulation", totalUsd: 2000000, confidenceScore: 82, whyItMatters: "Three observed wallets increased exposure.", explorerUrl: "https://hypurrscan.io/address/0x123" },
  { id: "b", category: "signal", coin: "SOL", signalType: "distribution", totalUsd: 3000000 },
  { id: "c", category: "position", coin: "HYPE", side: "long", sizeUsd: 4000000 },
] };

test("signal buckets never classify a short or transfer as distribution", () => {
  assert.equal(whaleSignalBucket(snapshot.rows[1]), "distribution");
  assert.equal(whaleSignalBucket({ category: "signal", signalType: "increase_short" }), "positions");
  assert.equal(whaleSignalBucket({ category: "transfer", direction: "to_exchange" }), "transfers");
  assert.equal(whaleCoinPath("<script>"), null);
});

test("coin metadata filters JSON-LD and participates in finite sitemap inventory", async () => {
  const seo = radarRouteSeo("/whales/hype", "zh-Hans", { snapshot });
  assert.match(seo.title, /HYPE 巨鲸/);
  const list = seo.schemas.find((schema) => schema["@type"] === "ItemList");
  assert.equal(list.numberOfItems, 2);
  assert.ok(list.itemListElement.every((item) => !item.name.includes("SOL")));
  assert.equal(radarRouteSeo("/whales/not-a-watchlist-coin"), null);
  assert.ok(routeInventory().some((row) => row.pathname === "/whales/hype"));
  assert.match(buildSitemap(routeInventory(), []), /<loc>https:\/\/nexualpha.com\/zh-hans\/whales\/hype<\/loc>/);
  const metadata = await routeMetadata(new URL("https://nexualpha.com/zh-hans/whales/hype"), { RADAR_READ: async () => snapshot });
  assert.equal(metadata.status, 200);
  assert.equal(metadata.canonical, "https://nexualpha.com/zh-hans/whales/hype");
  assert.match(metadata.title, /HYPE/);
});

test("whale page has four action filters; coin page renders all its observed activity", async () => {
  const harness = await createSsrHarness();
  try {
    const main = new JSDOM(await harness.render("https://nexualpha.com/zh-hans/whales", { radar: snapshot })).window.document;
    assert.deepEqual([...main.querySelectorAll("[data-whale-filter]")].map((el) => el.dataset.whaleFilter), ["signals", "distribution", "positions", "transfers"]);
    assert.match(main.body.textContent, /置信度: 82\/100/);
    assert.doesNotMatch(main.body.textContent, /Three observed wallets/, "English evidence line stays off localized pages");
    const english = new JSDOM(await harness.render("https://nexualpha.com/whales", { radar: snapshot })).window.document;
    assert.match(english.body.textContent, /Three observed wallets increased exposure/);
    const japanese = new JSDOM(await harness.render("https://nexualpha.com/ja/whales", { radar: snapshot })).window.document;
    assert.match(japanese.body.textContent, /信頼度: 82\/100/);
    assert.ok(main.querySelector('a[href="/zh-hans/whales/hype"]'));
    const coin = new JSDOM(await harness.render("https://nexualpha.com/whales/hype", { radar: snapshot })).window.document;
    assert.match(coin.querySelector("h1").textContent, /HYPE/);
    assert.ok(coin.querySelector('[data-whale-section="signals"]'));
    assert.ok(coin.querySelector('[data-whale-section="positions"]'));
    assert.equal(coin.querySelector('[data-whale-section="distribution"]'), null);
    assert.ok(!coin.querySelector("[data-whale-filter]"));
  } finally { await harness.close(); }
});

test("Base watchlist transfers retain reference valuation without exchange intent", () => {
  const row = {id:"base:tx:1",coin:"AERO",category:"transfer",chain:"base",source:"base-public-rpc",from:"0xa",to:"0xb",amount:200000,amountUsd:150000,observedAt:"2026-10-15T00:00:00Z",explorerUrl:"https://basescan.org/tx/0xabc",valuation:"Current DEX reference price; not execution value.",whyItMatters:"Trade intent unverified."};
  const feed = normalizeWhales({rows:[row,{...row,id:"small",amountUsd:99},{...row,id:"generic",source:"unreviewed"}]});
  assert.equal(feed.rows.length,1);
  assert.equal(feed.rows[0].asset,"AERO");
  assert.equal(feed.rows[0].direction,"unknown");
  assert.equal(feed.rows[0].fromAddress,"0xa");
  assert.equal(feed.rows[0].valuation,row.valuation);
});


test("large feeds preserve later categories and all coin activity", async () => {
  const harness = await createSsrHarness();
  const rows = Array.from({length: 55}, (_, i) => ({id:`signal-${i}`,category:"signal",coin:"HYPE",signalType:"accumulation",totalUsd:2000000}));
  rows.push({id:"late-transfer",asset:"HYPE",category:"transfer",amountUsd:3000000,fromLabel:"Binance",toLabel:"unknown",direction:"from_exchange",explorerUrl:"https://etherscan.io/tx/0x123"});
  const radar = {status:"ok",updatedAt:"2026-10-15T00:00:00Z",rows};
  try {
    const coin = new JSDOM(await harness.render("https://nexualpha.com/whales/hype", {radar})).window.document;
    assert.equal(coin.querySelectorAll(".nxradar-whale-cards li").length,55);
    assert.equal(coin.querySelectorAll(".nxradar-table tbody tr").length,1);
    const appHtml = await harness.render("https://nexualpha.com/whales", {radar});
    const state = JSON.stringify({pathname:"/whales",locale:"en",radar});
    const html = `<!doctype html><html><body><div id="root">${appHtml}</div><script type="application/json" id="nexualpha-prerender-state">${state}</script></body></html>`;
    let clicked = false;
    await hydrateInJsdom(harness.vite,html,"https://nexualpha.com/whales", {
      until: (window) => {
        if (!clicked) { window.document.querySelector('[data-whale-filter="transfers"]').click(); clicked = true; }
        return window.document.querySelectorAll(".nxradar-table tbody tr").length === 1;
      },
      inspect: (window) => assert.equal(window.document.querySelectorAll(".nxradar-table tbody tr").length,1),
    });
  } finally { await harness.close(); }
});
