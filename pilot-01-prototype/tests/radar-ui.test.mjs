import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { createSsrHarness, h1Texts, hydrateInJsdom, hydrationErrors } from "./helpers/ssr-hydration-harness.mjs";
import {
  RADAR_LOCALES,
  formatOpenInterest,
  normalizeLongShort,
  normalizeWhales,
  radarCopy,
  sortRows,
} from "../src/data/radar.js";
import { NEUTRAL_CTA_LOCALE_LIST } from "../src/data/locale-policy.js";

const SAMPLE_RADAR = {
  longShort: {
    status: "ok",
    updatedAt: "2026-10-13T00:58:00Z",
    sources: ["Binance futures data", "OKX Rubik stats", "Bybit account-ratio"],
    rows: [
      {
        symbol: "ETHUSDT",
        venue: "OKX",
        accountLongShortRatio: 1.45,
        topTraderLongShortRatio: 1.21,
        openInterest: 7321,
        openInterestUnit: "contracts",
        openInterestChange24hPct: -2.5,
        sparkline24h: [7600, 7550, 7420, 7321],
      },
      {
        symbol: "BTCUSDT",
        venue: "Binance",
        accountLongShortRatio: 2.32,
        topTraderLongShortRatio: 1.88,
        openInterestUsd: 1800000000,
        openInterestUnit: "USD",
        openInterestChange24hPct: 4.2,
        sparkline24h: [1.65e9, 1.7e9, 1.76e9, 1.8e9],
      },
    ],
  },
  whales: {
    status: "ok",
    updatedAt: "2026-10-13T01:02:00Z",
    sources: ["mempool.space", "public exchange-label list"],
    rows: [
      {
        asset: "BTC",
        chain: "Bitcoin",
        amount: 850.25,
        amountUsd: 94500000,
        fromLabel: "unknown",
        toLabel: "Binance",
        direction: "to_exchange",
        time: "2026-10-13T00:45:00Z",
        explorerUrl: "https://mempool.space/tx/example",
      },
      {
        asset: "USDT",
        chain: "Ethereum",
        amount: 12000000,
        amountUsd: 12000000,
        fromLabel: "OKX",
        toLabel: "unknown",
        direction: "from_exchange",
        time: "2026-10-13T00:40:00Z",
      },
    ],
  },
};

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

test("radar copy exposes route titles for every supported locale", () => {
  assert.equal(RADAR_LOCALES.length, 17);
  for (const locale of RADAR_LOCALES) {
    const copy = radarCopy(locale);
    assert.ok(copy.longShortTitle, `${locale}.longShortTitle`);
    assert.ok(copy.whalesTitle, `${locale}.whalesTitle`);
    assert.ok(copy.longShortLead, `${locale}.longShortLead`);
    assert.ok(copy.whalesSummary, `${locale}.whalesSummary`);
  }
});

test("normalizers keep per-venue open-interest units, unknown labels and sortable numeric fields", () => {
  const longShort = normalizeLongShort(SAMPLE_RADAR.longShort);
  assert.equal(longShort.rows.length, 2);
  const eth = longShort.rows.find((row) => row.symbol === "ETHUSDT");
  assert.equal(formatOpenInterest(eth), "7,321 contracts");
  const btc = longShort.rows.find((row) => row.symbol === "BTCUSDT");
  assert.equal(formatOpenInterest(btc), "$1.80B USD");
  assert.deepEqual(sortRows(longShort.rows, "accountRatio", "desc").map((row) => row.symbol), ["BTCUSDT", "ETHUSDT"]);

  const whales = normalizeWhales(SAMPLE_RADAR.whales);
  assert.equal(whales.rows[0].fromLabel, "unknown");
  assert.equal(whales.rows[0].direction, "to_exchange");
  assert.deepEqual(sortRows(whales.rows, "amountUsd", "desc").map((row) => row.asset), ["BTC", "USDT"]);
});

test("route SSR renders populated long/short and whales pages with CTA, sparkline and transfer caveat", async () => {
  const longHtml = await harness.render("https://nexualpha.com/long-short", { radar: SAMPLE_RADAR });
  assert.deepEqual(h1Texts(longHtml), ["Long/short radar"]);
  let doc = new JSDOM(longHtml).window.document;
  assert.equal(doc.querySelector("[data-testid='long-short-page']")?.getAttribute("dir"), "ltr");
  assert.equal(doc.querySelectorAll(".nxradar-table tbody tr").length, 2);
  assert.equal(doc.querySelector(".nxradar-table tbody th")?.textContent, "BTCUSDT", "default sort puts highest account ratio first");
  assert.ok(doc.querySelector(".nxradar-spark polyline"), "24h sparkline renders");
  assert.ok(doc.body.textContent.includes("$1.80B USD"), "USD OI keeps explicit unit");
  assert.ok(doc.body.textContent.includes("7,321 contracts"), "native OI unit is not blended into USD");
  assert.ok(doc.querySelector('a[href="/go/binance?src=long-short"]'), "soft geo-gated go route is used");
  assert.ok(doc.querySelector(".news-offer--inline"), "partner CTA block renders through the existing offer component");

  const whalesHtml = await harness.render("https://nexualpha.com/whales", { radar: SAMPLE_RADAR });
  assert.deepEqual(h1Texts(whalesHtml), ["Whale transfer radar"]);
  doc = new JSDOM(whalesHtml).window.document;
  assert.equal(doc.querySelectorAll(".nxradar-table tbody tr").length, 2);
  assert.ok(doc.body.textContent.includes("Unlabelled wallet"), "unknown counterparties render as an unlabelled wallet");
  const method = doc.querySelector("details.nxradar-method");
  assert.ok(method && !method.hasAttribute("open"), "methodology sits in a collapsed block");
  assert.ok(method.textContent.includes("not proof of a sale"), "exchange-transfer note lives in the collapsed methodology");
  assert.equal(doc.querySelector(".nxradar-hero").textContent.includes("not proof of a sale"), false, "no caveat above the fold");
  assert.ok(doc.querySelector('a[href="https://mempool.space/tx/example"]'), "explorer link is preserved as the source action");
  assert.ok(doc.querySelector('a[href="/go/bitget?src=whales"]'), "whales CTA uses its own src attribution");
});

test("route SSR keeps readable unavailable states and RTL direction", async () => {
  const unavailable = await harness.render("https://nexualpha.com/ar/long-short", { radar: { longShort: { status: "unavailable", rows: [], updatedAt: null, sources: [] } } });
  const doc = new JSDOM(unavailable).window.document;
  assert.equal(doc.querySelector("[data-testid='long-short-page']")?.getAttribute("dir"), "rtl");
  assert.ok(doc.querySelector("[data-testid='radar-unavailable']"));
  assert.ok(doc.body.textContent.includes(radarCopy("ar").unavailableTitle));

  const { LongShortPage } = await harness.vite.ssrLoadModule("/src/components/radar/RadarPages.jsx");
  const staticHtml = renderToStaticMarkup(React.createElement(LongShortPage, { locale: "zh-Hans", initial: SAMPLE_RADAR }));
  assert.match(staticHtml, /多空比雷达/);
  assert.match(staticHtml, /BTCUSDT/);
});



test('populated radar SSR hydrates with the identical rows and no recoverable mismatch', async () => {
  for (const [path, kind] of [['/long-short', 'longShort'], ['/whales', 'whales']]) {
    const payload = SAMPLE_RADAR[kind];
    const appHtml = await harness.render(`https://nexualpha.com${path}`, { radar: payload });
    const state = JSON.stringify({ pathname: path, locale: 'en', radar: payload }).replaceAll('<', '\\u003c');
    const html = `<!doctype html><html><head></head><body><div id="root">${appHtml}</div><script type="application/json" id="nexualpha-prerender-state">${state}</script></body></html>`;
    const result = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`);
    assert.deepEqual(hydrationErrors(result.errors), [], path);
  }
});

test("zh-Hans radar UI is fully localized: headers, directions, venue names and row action", async () => {
  const { LongShortPage, WhalesPage } = await harness.vite.ssrLoadModule("/src/components/radar/RadarPages.jsx");
  const longRows = { ...SAMPLE_RADAR.longShort, rows: SAMPLE_RADAR.longShort.rows.map((row) => ({ ...row, venue: row.venue.toLowerCase() })) };
  let doc = new JSDOM(renderToStaticMarkup(React.createElement(LongShortPage, { locale: "zh-Hans", initial: { longShort: longRows } }))).window.document;
  const headers = [...doc.querySelectorAll(".nxradar-table thead th")].map((th) => th.textContent).join(" ");
  for (const label of ["币种", "平台", "账户多空比", "大户多空比", "未平仓量"]) assert.ok(headers.includes(label), label);
  assert.ok(!/Symbol|Venue|Open interest/.test(headers));
  const venues = [...doc.querySelectorAll(".nxradar-table tbody td[data-label='平台'] > span")].map((el) => el.textContent);
  assert.deepEqual(venues.sort(), ["Binance", "OKX"]);
  const action = doc.querySelector(".nxradar-go");
  assert.match(action.textContent, /^查看 (Binance|OKX)$/);
  assert.match(action.getAttribute("href"), /^\/go\/(binance|okx)\?src=long-short&locale=zh-Hans$/, "keeps /go route with src attribution");
  assert.equal(doc.querySelector(".nxradar-hero").textContent.includes("多空比反映"), false);
  assert.ok(!doc.querySelector(".nxradar-hero ul"), "no English limitation bullets above the fold");
  assert.equal(doc.querySelector("details.nxradar-method summary").textContent, "数据说明");

  doc = new JSDOM(renderToStaticMarkup(React.createElement(WhalesPage, { locale: "zh-Hans", initial: SAMPLE_RADAR }))).window.document;
  const whaleHeaders = [...doc.querySelectorAll(".nxradar-table thead th")].map((th) => th.textContent).join(" ");
  for (const label of ["资产", "数量", "转出方", "转入方", "方向", "时间"]) assert.ok(whaleHeaders.includes(label), label);
  const body = doc.querySelector(".nxradar-table tbody").textContent;
  assert.ok(body.includes("转入交易所") && body.includes("未标注钱包"));
  assert.ok(!/unknown|to exchange/.test(body));
  assert.equal(doc.querySelector(".nxradar-hero").textContent.includes("不等于卖出"), false);
});

test("neutral locales get profile links instead of sponsored routes and no offer block", async () => {
  const { LongShortPage } = await harness.vite.ssrLoadModule("/src/components/radar/RadarPages.jsx");
  for (const locale of NEUTRAL_CTA_LOCALE_LIST) {
    const doc = new JSDOM(renderToStaticMarkup(React.createElement(LongShortPage, { locale, initial: SAMPLE_RADAR }))).window.document;
    assert.equal(doc.querySelectorAll('a[href^="/go/"]').length, 0, locale);
    assert.equal(doc.querySelectorAll('a[rel~="sponsored"]').length, 0, locale);
    assert.ok(doc.querySelector(".nxradar-go--profile"), locale);
  }
});

test("every radar locale localizes table headers, directions and unknown label", () => {
  const en = radarCopy("en");
  for (const locale of RADAR_LOCALES.filter((l) => l !== "en")) {
    const copy = radarCopy(locale);
    for (const key of ["symbol", "venue", "accountRatio", "topTraderRatio", "oi", "asset", "amount", "from", "to", "direction", "time"]) {
      // "Symbol", "Asset" and "Open interest" are the native trading terms in several Latin-script locales.
      if (["symbol", "asset", "oi", "direction"].includes(key) && ["de", "it", "fr", "pt-BR", "id"].includes(locale)) continue;
      assert.notEqual(copy.columns[key], en.columns[key], `${locale}.${key}`);
    }
    for (const key of ["to_exchange", "from_exchange", "wallet_to_wallet", "unknown"]) assert.notEqual(copy.directions[key], en.directions[key], `${locale}.${key}`);
    assert.notEqual(copy.unknown, "unknown", locale);
    assert.match(copy.viewVenueNamed, /\{venue\}/);
  }
});
