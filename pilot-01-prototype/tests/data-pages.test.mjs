import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import worker, { renderLocaleSitemap, routeMetadata } from "../worker/index.js";
import { budgetTitle, metaDescriptionLimit, titleBudgetForLocale } from "../src/data/meta-description.js";
import { localizedPath, parsePublicRoute } from "../src/data/locale-routing.js";
import {
  DATA_PAGE_LOCALES, DATA_PAGE_PATHS, FUNDING_RATES_PATH, LIQUIDATIONS_PATH, compactMarketEvents, dataPageCopy, dataPageMeta, dataPageSchemas,
  formatRatePct, formatUsdCompact, formatUtc, formatUtcTime, readFunding, readLiquidations, splitSymbol,
} from "../src/data/market-data-pages.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const sampleFeed = JSON.parse(readFileSync(new URL("./fixtures/market-data/market-events.sample.json", import.meta.url), "utf8"));
const CJK = new Set(["zh-Hans", "zh-Hant", "ja", "ko"]);
const shell = '<!doctype html><html lang="en"><head><title>Base</title><meta name="description" content="Base"></head><body><div id="root"></div></body></html>';
const assets = { async fetch(request) {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/index.html") return new Response(shell, { headers: { "content-type": "text/html" } });
  return new Response("missing", { status: 404 });
} };

test("both data pages have route metadata in all 17 locales: review-gated, self-canonical, length-bounded, full hreflang", async () => {
  assert.equal(DATA_PAGE_LOCALES.length, 17);
  for (const pathname of DATA_PAGE_PATHS) {
    for (const locale of DATA_PAGE_LOCALES) {
      const loc = `https://nexualpha.com${localizedPath(pathname, locale)}`;
      const meta = await routeMetadata(new URL(loc), {});
      assert.equal(meta.status, 200, loc);
      assert.equal(meta.robots, ["ur", "uk"].includes(locale) ? "noindex,follow" : "index,follow", loc);
      assert.equal(meta.canonical, loc, loc);
      assert.equal(meta.locale, locale, loc);
      assert.equal(meta.title, budgetTitle(dataPageMeta(pathname, locale).title, titleBudgetForLocale(locale)));
      assert.ok(meta.title.length <= titleBudgetForLocale(locale), `${loc} title ${meta.title.length}`);
      assert.ok(meta.description.length <= metaDescriptionLimit(locale, meta.description), `${loc} description ${meta.description.length}`);
      // Served as written since 2026-10-13 (no generic padding; short CJK descriptions are fine).
      assert.doesNotMatch(meta.description, /Use this NexuAlpha page|用这一页了解|source boundary/, loc);
      assert.equal(meta.alternates.length, ["ur", "uk"].includes(locale) ? 0 : 16, loc);
      if (["ur", "uk"].includes(locale)) continue;
      assert.ok(meta.alternates.some((a) => a.hreflang === "x-default" && a.href === `https://nexualpha.com${pathname}`), loc);
      assert.ok(meta.alternates.some((a) => a.hreflang === locale && a.href === loc), loc);
    }
    // titles and descriptions are translated, not copied from English
    const english = dataPageMeta(pathname, "en");
    for (const locale of DATA_PAGE_LOCALES.filter((l) => l !== "en")) {
      assert.notEqual(dataPageMeta(pathname, locale).title, english.title, `${pathname} ${locale} title`);
      assert.notEqual(dataPageMeta(pathname, locale).description, english.description, `${pathname} ${locale} description`);
    }
  }
  const legacy = await routeMetadata(new URL("https://nexualpha.com/liquidations?locale=ja"), {});
  assert.equal(legacy.locale, "ja");
  assert.equal(legacy.canonical, "https://nexualpha.com/ja/liquidations");
});

test("locale prefixes apply to the data pages", () => {
  assert.equal(localizedPath(LIQUIDATIONS_PATH, "zh-Hans"), "/zh-hans/liquidations");
  assert.equal(localizedPath(FUNDING_RATES_PATH, "pt-BR"), "/pt-br/funding-rates");
  assert.equal(localizedPath(FUNDING_RATES_PATH, "en"), "/funding-rates");
  const parsed = parsePublicRoute("/ar/funding-rates", new URLSearchParams());
  assert.equal(parsed.contentPathname, "/funding-rates");
  assert.equal(parsed.locale, "ar");
  assert.equal(parsed.localeSource, "path");
});

test("structured data: Dataset points at the JSON feed, FAQPage carries every visible question, breadcrumb is two steps", () => {
  for (const pathname of DATA_PAGE_PATHS) {
    for (const locale of DATA_PAGE_LOCALES) {
      const schemas = dataPageSchemas(pathname, locale);
      const types = schemas.map((s) => s["@type"]);
      assert.deepEqual(types, ["Dataset", "FAQPage", "BreadcrumbList"], `${pathname} ${locale}`);
      const [dataset, faq, crumbs] = schemas;
      assert.equal(dataset["@context"], "https://schema.org");
      assert.equal(dataset.distribution[0].contentUrl, "https://nexualpha.com/intel/market-events.json");
      assert.equal(dataset.url, `https://nexualpha.com${localizedPath(pathname, locale)}`);
      assert.match(dataset.temporalCoverage, /^\d{4}-\d{2}-\d{2}\/\.\.$/);
      assert.equal(dataset.inLanguage, locale);
      const page = dataPageCopy(locale)[pathname === LIQUIDATIONS_PATH ? "liquidations" : "funding"];
      assert.ok(page.faq.length >= 3 && page.faq.length <= 4, `${pathname} ${locale} faq count`);
      assert.equal(faq.mainEntity.length, page.faq.length);
      for (const [i, [question, answer]] of page.faq.entries()) {
        assert.equal(faq.mainEntity[i]["@type"], "Question");
        assert.equal(faq.mainEntity[i].name, question);
        assert.equal(faq.mainEntity[i].acceptedAnswer.text, answer);
        assert.ok(answer.length > 40, `${pathname} ${locale} answer ${i} too short`);
      }
      assert.equal(crumbs.itemListElement.length, 2);
      assert.equal(crumbs.itemListElement[1].item, dataset.url);
      assert.equal(crumbs.itemListElement[1].name, page.h1);
      JSON.parse(JSON.stringify(schemas)); // serialisable, no functions leaked from the copy table
      assert.ok(page.explainer.length === 3 && page.explainer.every((p) => p.length > (CJK.has(locale) ? 40 : 80)), `${pathname} ${locale} explainer`);
    }
  }
  // the liquidations explainer names the double-kill pattern in every locale
  for (const locale of DATA_PAGE_LOCALES) {
    const text = dataPageCopy(locale).liquidations.explainer.join(" ");
    assert.ok(/多空双杀|多空雙殺|多空双殺/.test(text), `${locale} explains 多空双杀`);
  }
});

test("worker head carries the data-page schema, canonical and hreflang for a localized request", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/de/funding-rates", { headers: { accept: "text/html" } }), { ASSETS: assets });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /rel="canonical" href="https:\/\/nexualpha\.com\/de\/funding-rates"/);
  assert.match(html, /hreflang="x-default" href="https:\/\/nexualpha\.com\/funding-rates"/);
  assert.match(html, /hreflang="ar" href="https:\/\/nexualpha\.com\/ar\/funding-rates"/);
  assert.match(html, /<title[^>]*>Krypto-Funding-Raten/);
  assert.match(html, /"@type":"Dataset"/);
  assert.match(html, /"@type":"FAQPage"/);
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.match(html, /<meta name="robots" content="index,follow"/);
});

test("locale sitemap lists both data pages in 15 reviewed locales and excludes the two drafts", async () => {
  const xml = await renderLocaleSitemap({});
  for (const pathname of DATA_PAGE_PATHS) {
    for (const locale of DATA_PAGE_LOCALES) {
      const loc = `https://nexualpha.com${localizedPath(pathname, locale)}`;
      assert.equal(xml.includes(`<loc>${loc}</loc>`), !["ur", "uk"].includes(locale), loc);
    }
  }
});

test("feed readers normalize the collector document and refuse to invent numbers", () => {
  const liq = readLiquidations(sampleFeed);
  assert.equal(liq.windows.h24.totalUsd, 6114135);
  assert.equal(formatUsdCompact(liq.windows.h24.totalUsd), "$6.11M");
  assert.equal(liq.windows.h24.topSymbols[0].base, "SOL");
  assert.equal(liq.windows.h24.topSymbols[0].venue, "OKX");
  assert.deepEqual(liq.windows.h24.coverage.venues, ["OKX"]);
  assert.equal(liq.windows.h24.coverage.label, "OKX observed liquidations");
  assert.equal(liq.sourceLine, "OKX observed liquidations");
  assert.ok(Math.abs(liq.windows.h24.longShare - 1233574 / 6114135) < 1e-9);
  const withCoverage = readLiquidations({
    generatedAt: sampleFeed.generatedAt,
    liquidations: {
      coverage: { binance: { status: "silent", available: false } },
      h1: { totalUsd: 1, longUsd: 1, shortUsd: 0, orders: 1, coverage: { label: "Binance + OKX observed liquidations", venues: ["OKX"], venueCount: 1 } },
      h24: { totalUsd: 2, longUsd: 2, shortUsd: 0, orders: 1, coverage: { venues: ["Binance"], venueCount: 1 } },
    },
  });
  assert.equal(withCoverage.windows.h1.coverage.label, "OKX observed liquidations", "do not trust stale coverage labels over venue fields");
  assert.equal(withCoverage.sourceLine, "Binance observed liquidations; Binance stream silent", "the hero uses the 24h window coverage and exposes a silent Binance watchdog");
  const explicitEmpty = readLiquidations({ generatedAt: sampleFeed.generatedAt, liquidations: { h24: { totalUsd: 1, longUsd: 1, shortUsd: 0, orders: 1, coverage: { venues: [], venueCount: 0 }, topSymbols: [{ symbol: "BTCUSDT", usd: 1 }] } } });
  assert.equal(explicitEmpty.windows.h24.coverage.label, "No observed liquidations", "an explicit empty coverage list is not backfilled from legacy symbols");
  assert.deepEqual(splitSymbol("BTCUSDT"), { base: "BTC", venue: "Binance", raw: "BTCUSDT" });
  assert.equal(readLiquidations(null), null);
  assert.equal(readLiquidations({ generatedAt: "nope", liquidations: { h1: {} } }), null);
  const funding = readFunding(sampleFeed);
  assert.equal(funding.rows.length, 4);
  assert.equal(funding.rows[0].symbol, "BTC");
  assert.equal(funding.rows[0].binanceApr, 0.0000326 * 3 * 365);
  assert.equal(funding.rows[2].okxRate, null);
  assert.equal(funding.rows[2].okxApr, null);
  assert.equal(readFunding({ generatedAt: sampleFeed.generatedAt, liquidations: sampleFeed.liquidations }), null, "older collector without a funding block");
  assert.equal(formatRatePct(0.0000326), "+0.0033%");
  assert.equal(formatRatePct(-0.00012, 4), "−0.0120%");
  assert.equal(formatRatePct(null), "—");
  assert.equal(formatUtc("2026-10-10T14:58:12.739Z"), "2026-10-10 · 22:58 SGT");
  assert.equal(formatUtc("2026-10-10T18:30:00.000Z"), "2026-10-11 · 02:30 SGT");
  assert.equal(formatUtc("2026-10-10T14:58:12.739Z", { seconds: true }), "2026-10-10 · 22:58:12 SGT");
  assert.equal(formatUtcTime("2026-10-10T16:00:00.000Z"), "00:00 SGT");
  const compact = compactMarketEvents(sampleFeed);
  assert.ok(!("headlines" in compact) && !("events" in compact), "hydration payload drops headlines and events");
  assert.ok(compact.liquidations && compact.funding && compact.market.majors);
});

async function renderPages(feedJson) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-data-pages-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { LiquidationsPage } from "../../src/components/data/LiquidationsPage.jsx";
      import { FundingRatesPage } from "../../src/components/data/FundingRatesPage.jsx";
      const feed = ${feedJson};
      const out = {};
      for (const locale of ["en", "zh-Hans", "ar", "tr"]) {
        out[locale] = {
          liquidations: renderToStaticMarkup(React.createElement(LiquidationsPage, { locale, initialFeed: feed })),
          funding: renderToStaticMarkup(React.createElement(FundingRatesPage, { locale, initialFeed: feed })),
        };
      }
      console.log(JSON.stringify(out));
    `);
    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [entryPath, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundlePath}`, "--loader:.css=empty", "--log-level=warning"], { cwd: projectRoot, stdio: "pipe" });
    return JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8" }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("SSR renders the fixture numbers, the sign-up card (no in-card disclosure) and the Telegram line; no feed renders the unavailable state", async () => {
  const withFeed = await renderPages(JSON.stringify(sampleFeed));
  const en = withFeed.en.liquidations;
  assert.match(en, /<h1><span class="nx-glossary-tip"><a[^>]*>Crypto liquidations today<\/a>/);
  assert.ok(en.includes("$6.11M"), "24h total");
  assert.ok(en.includes("$3.34M"), "1h total");
  assert.ok(en.includes("$1,452,978"), "largest single liquidation");
  assert.ok(en.includes("Data updated 2026-10-10 22:58 SGT"), "generatedAt in SGT (freshness stamp format, 2026-10-18)");
  assert.match(en, /<th scope="row" translate="no">SOL<\/th><td translate="no">OKX<\/td>/);
  // The explainer keeps the coverage limit as real content; the hero source line carries no caveat suffix (owner 2026-10-12).
  assert.match(en, /lower bound for two exchanges, not the whole market/);
  assert.match(en, /<strong>Source:<\/strong> OKX observed liquidations/);
  assert.doesNotMatch(en, /<strong>Source:<\/strong> Binance/);
  assert.doesNotMatch(en, /liquidation orders · lower bound/);
  assert.match(en, /t\.me\/NexuAlphaAssistantBot\?start=alerts/, "Telegram alerts line");
  assert.match(en, /class="news-offer news-offer--inline"/, "partner sign-up card");
  assert.doesNotMatch(en, /commission-disclosure-line|data-disclosure-placement=/, "owner rule 2026-10-12: no commission disclosure inside the card");
  assert.match(en, /data-offer-venue="(okx|bitget|binance)"/);
  assert.ok(!en.includes("data-unavailable"));
  const fr = withFeed.en.funding;
  assert.match(fr, /<h1><span class="nx-glossary-tip"><a[^>]*>Crypto funding rates: Binance vs OKX<\/a>/);
  assert.ok(fr.includes("+0.0033%"), "per-period rates with sign");
  assert.doesNotMatch(fr, /<th scope="row" translate="no">SOL<\/th>/, "incomplete comparison rows stay hidden");
  assert.ok(fr.includes("+3.6%"), "annualized estimate of BTC Binance rate (0.0000326 × 1095)");
  assert.ok(fr.includes("00:00 SGT"), "next funding time in SGT");
  assert.match(fr, /rate × 3 × 365/);
  assert.match(fr, /<th scope="row" translate="no">1000PEPE<\/th>/);
  assert.doesNotMatch(fr, />—</, "missing funding observations do not become placeholder cells");
  assert.doesNotMatch(fr, /−0.0120%/, "unpaired observation is hidden rather than rendered with a placeholder");
  assert.match(withFeed["zh-Hans"].liquidations, /<h1><span class="nx-glossary-tip"><a[^>]*>今日加密货币爆仓<\/a>/);
  assert.match(withFeed["zh-Hans"].liquidations, /多空双杀/);
  assert.match(withFeed.ar.funding, /<main[^>]*dir="rtl"/);
  assert.match(withFeed.tr.funding, /<h1><span class="nx-glossary-tip"><a[^>]*>Kripto fonlama oranları: Binance vs OKX<\/a>/);
  assert.ok(withFeed.ar.funding.includes("+0.0033%"), "numbers stay identical in RTL");

  const without = await renderPages("null");
  assert.match(without.en.liquidations, /data-testid="data-unavailable"/);
  assert.match(without.en.liquidations, /Live data is temporarily unavailable/);
  assert.match(without.en.liquidations, /<strong>Source:<\/strong> No observed liquidations/);
  assert.doesNotMatch(without.en.liquidations, /<strong>Source:<\/strong> Binance/);
  assert.ok(!without.en.liquidations.includes("$6.11M"));
  assert.match(without.en.funding, /data-testid="data-unavailable"/);
  assert.match(without.en.funding, /<h1><span class="nx-glossary-tip"><a[^>]*>Crypto funding rates: Binance vs OKX<\/a>/, "H1, explainer and FAQ still render");
  assert.match(without.en.funding, /news-offer--inline/);
  const olderCollector = await renderPages(JSON.stringify({ generatedAt: sampleFeed.generatedAt, liquidations: sampleFeed.liquidations }));
  assert.match(olderCollector.en.funding, /data-unavailable/, "no funding block → unavailable, nothing invented");
  assert.ok(olderCollector.en.liquidations.includes("$6.11M"));
});

test("worker SSRs the data pages through the renderer with the 60-second feed and embeds the compact feed for hydration", async () => {
  const calls = [];
  const env = {
    ASSETS: assets,
    MARKET_EVENTS_READ: async () => sampleFeed,
    NEWS_SSR_RENDER: async (href, options) => { calls.push({ href, options }); return `<main class="nxd"><header class="nxd-hero">rendered ${options.marketEvents?.liquidations?.h24?.totalUsd}</header></main>`; },
  };
  const response = await worker.fetch(new Request("https://nexualpha.com/zh-hans/liquidations", { headers: { accept: "text/html" } }), env);
  const html = await response.text();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].href, "https://nexualpha.com/zh-hans/liquidations");
  assert.ok(!("headlines" in calls[0].options.marketEvents), "renderer receives the compact feed");
  assert.match(html, /<div id="root"><main class="nxd"><header class="nxd-hero">rendered 6114135<\/header><\/main><\/div>/);
  const state = JSON.parse(html.match(/<script type="application\/json" id="nexualpha-prerender-state">([\s\S]*?)<\/script>/)[1]);
  assert.equal(state.pathname, "/liquidations");
  assert.equal(state.locale, "zh-Hans");
  assert.equal(state.marketEvents.liquidations.h24.totalUsd, 6114135);
  assert.ok(!state.marketEvents.headlines);

  // feed reader failing: page still SSRs (unavailable state), nothing is embedded
  const failing = { ...env, MARKET_EVENTS_READ: async () => { throw new Error("down"); }, NEWS_SSR_RENDER: async (href, options) => `<main class="nxd"><header class="nxd-hero">feed=${String(options.marketEvents)}</header></main>` };
  const degraded = await (await worker.fetch(new Request("https://nexualpha.com/funding-rates", { headers: { accept: "text/html" } }), failing)).text();
  assert.match(degraded, /feed=null/);
  assert.ok(!/"marketEvents"/.test(degraded));

  // assets-only host (no renderer): client-rendered shell, still 200 and indexable
  const shellOnly = await worker.fetch(new Request("https://nexualpha.com/funding-rates", { headers: { accept: "text/html" } }), { ASSETS: assets });
  assert.equal(shellOnly.status, 200);
  assert.match(await shellOnly.text(), /<div id="root"><\/div>/);
});

test("navigation and footer link to the data pages and the build ships the shared data module", () => {
  const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(app, /dataPageCopy\(locale\)\.nav\.liquidations, withLocale\(locale, LIQUIDATIONS_PATH\)/);
  assert.match(app, /route\.name === "liquidations"/);
  assert.match(app, /route\.name === "fundingRates"/);
  const footer = readFileSync(new URL("../src/components/v3/CleanFooter.jsx", import.meta.url), "utf8");
  assert.match(footer, /href\("\/liquidations"\)/);
  assert.match(footer, /href\("\/funding-rates"\)/);
  const prepare = readFileSync(new URL("../scripts/prepare-sites-build.mjs", import.meta.url), "utf8");
  assert.match(prepare, /"market-data-pages\.js"/);
  for (const locale of DATA_PAGE_LOCALES) {
    const nav = dataPageCopy(locale).nav;
    assert.ok(nav.data && nav.liquidations && nav.funding, locale);
  }
});

test("server feed reader caches for 60 seconds and keeps the last good feed through a failed read", async () => {
  const { createMarketEventsReader } = await import("../server/market-events-feed.mjs");
  let clock = 1_000_000, fetches = 0, fail = false;
  const reader = createMarketEventsReader({
    url: "https://example.test/intel/market-events.json", now: () => clock, ttlMs: 60_000, staleMs: 10 * 60_000,
    fetchImpl: async () => { fetches += 1; if (fail) throw new Error("boom"); return new Response(JSON.stringify(sampleFeed), { status: 200 }); },
  });
  assert.equal((await reader.read()).generatedAt, sampleFeed.generatedAt);
  await reader.read(); await reader.read();
  assert.equal(fetches, 1, "one network read per 60 s");
  clock += 61_000; fail = true;
  assert.equal((await reader.read()).generatedAt, sampleFeed.generatedAt, "last good feed survives a failed refresh");
  assert.equal(fetches, 2);
  clock += 11 * 60_000;
  const retained = await reader.read();
  assert.equal(retained.generatedAt, sampleFeed.generatedAt, "outage keeps the last-good source clock");
  assert.equal(retained.stale, true, "expired source is explicitly stale, never presented as fresh");
});
