import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildFinderResults, finderSafeContext, finderTrackPayload, searchFinderResults, withLocale } from "../src/components/finder/finder-results.js";

const copy = {
  locale: "zh-Hans",
  nav: { exchanges: "交易所", compare: "比较", listings: "上币" },
  discovery: { title: "选择适合你的交易平台" },
  home: {
    compareLabel: "开户注册前先比较",
    compareText: "选择两到三家平台，核对开户条件、活动信息和官方域名入口。",
    exploreText: "按使用需求浏览平台。",
    sourcesLabel: "活动与上币中心",
    sourcesText: "只展示可追溯的官方动态。",
  },
};

test("closed search does not reference an unmounted listbox", () => {
  const source = readFileSync(new URL("../src/components/finder/CommandFinder.jsx", import.meta.url), "utf8");
  assert.match(source, /aria-controls=\{open \? listboxId : undefined\}/);
});

test("labelled discovery controls expose an accessible group role", () => {
  const yellowPages = readFileSync(new URL("../src/components/v3/VenueYellowPages.jsx", import.meta.url), "utf8");
  const explorer = readFileSync(new URL("../src/components/venue-explorer/VenueExplorer.jsx", import.meta.url), "utf8");
  assert.match(yellowPages, /className="yellow-pages__tabs" role="group" aria-label=\{ui\.sectionTitle\}/);
  assert.doesNotMatch(yellowPages, /role="tab(?:list)?"|aria-selected=/);
  assert.match(yellowPages, /aria-pressed=\{selectedCategory === cat\.id\}/);
  assert.match(explorer, /className="venue-explorer__view" role="group" aria-label=/);
});

const command = {
  venueCatalog: [
    { slug: "binance", name: "Binance", category: "CEX", officialDomain: "www.binance.com" },
    { slug: "okx", name: "OKX", category: "CEX", officialDomain: "www.okx.com" },
    { slug: "bybit", name: "Bybit", category: "CEX", officialDomain: "www.bybit.com" },
    { slug: "bitget", name: "Bitget", category: "CEX", officialDomain: "www.bitget.com" },
    { slug: "backpack", name: "Backpack", category: "CEX", officialDomain: "backpack.exchange" },
    { slug: "uniswap", name: "Uniswap", category: "DEX", officialDomain: "app.uniswap.org" },
    { slug: "jupiter", name: "Jupiter", category: "DEX", officialDomain: "jup.ag" },
    { slug: "drift", name: "Drift", category: "Perp DEX", officialDomain: "app.drift.trade" },
  ],
  finderGroups: [
    { label: "市场路径", items: ["TSLA · 代币化股票", "这不是可跳转结果"] },
  ],
};

test("finder builds only actionable destinations and keeps locale in every href", () => {
  const results = buildFinderResults({ copy, command, locale: "zh-Hans" });
  assert.ok(results.length > command.venueCatalog.length);
  assert.ok(results.every((result) => result.href.startsWith("/")));
  assert.ok(results.filter((result) => !result.href.startsWith("/br") && !result.href.startsWith("/ja") && !result.href.startsWith("/ko") && !result.href.startsWith("/markets/turkiye")).every((result) => result.href.startsWith("/zh-hans")));
  assert.ok(results.every((result) => result.href));
  assert.ok(results.some((result) => result.href === "/zh-hans/exchanges"));
  assert.ok(results.some((result) => result.href === "/zh-hans/activities"));
  assert.ok(results.some((result) => result.href === "/zh-hans/compare/binance-vs-okx"));
  assert.ok(results.some((result) => result.href === "/zh-hans#compare"));
  assert.equal(results.some((result) => /TSLA|这不是/.test(result.label)), false);
});

test("empty query returns useful suggestions before typed search results", () => {
  const results = buildFinderResults({ copy, command, locale: "zh-Hans" });
  const suggestions = searchFinderResults(results, "", "zh-Hans", 4);
  assert.deepEqual(suggestions.map((result) => result.href), [
    "/zh-hans/exchanges",
    "/zh-hans#compare",
    "/zh-hans/activities",
    "/zh-hans/compare/binance-vs-okx",
  ]);
});

test("typed search matches venue names, categories, domains, and comparison pairs", () => {
  const results = buildFinderResults({ copy, command, locale: "zh-Hans" });
  assert.equal(searchFinderResults(results, "Backpack", "zh-Hans")[0].href, "/zh-hans/exchanges/backpack");
  assert.ok(searchFinderResults(results, "DEX", "zh-Hans").some((result) => result.href === "/zh-hans/exchanges/uniswap"));
  assert.ok(searchFinderResults(results, "okx.com", "zh-Hans").some((result) => result.href === "/zh-hans/exchanges/okx"));
});

test("default component-style result index keeps all venue detail pages searchable", () => {
  const results = buildFinderResults({ copy, command, locale: "zh-Hans" });
  for (const slug of ["okx", "backpack", "drift"]) {
    const found = searchFinderResults(results, slug, "zh-Hans");
    assert.equal(found[0].href, `/zh-hans/exchanges/${slug}`);
  }
});

test("no result stays an honest empty result set", () => {
  const results = buildFinderResults({ copy, command, locale: "zh-Hans" });
  assert.deepEqual(searchFinderResults(results, "definitely-not-a-platform", "zh-Hans"), []);
});

test("Chinese brand aliases find the existing profile without renaming official brands", () => {
  for (const locale of ["zh-Hans", "zh-Hant", "en"]) {
    const results = buildFinderResults({ copy, command, locale });
    for (const [query, slug, name] of [["币安", "binance", "Binance"], ["幣安", "binance", "Binance"], ["欧易", "okx", "OKX"], ["歐易", "okx", "OKX"]]) {
      const found = searchFinderResults(results, query, locale);
      assert.equal(found[0]?.href, withLocale(locale, `/exchanges/${slug}`));
      assert.equal(found[0]?.label, name);
    }
  }
});

test("locale helper places query parameters before anchors", () => {
  assert.equal(withLocale("en", "/#compare"), "/#compare");
  assert.equal(withLocale("ja", "/#compare"), "/ja#compare");
  assert.equal(withLocale("zh-Hant", "/compare/binance-vs-okx"), "/zh-hant/compare/binance-vs-okx");
});

test("research keywords and localized facts find real profiles without fabricated markets", () => {
  const results = buildFinderResults({ copy, command, locale: "zh-Hans" });
  assert.ok(searchFinderResults(results, "身份验证", "zh-Hans").some((entry) => entry.href === "/zh-hans/exchanges/binance"));
  assert.ok(searchFinderResults(results, "kyc", "zh-Hans").some((entry) => entry.href === "/zh-hans/exchanges/bybit"));
  assert.ok(results.every((entry) => entry.href.startsWith("/") && !entry.href.includes("ref=")));
});

test("finder serves high-intent regional and product routes with safe context only", () => {
  const context = finderSafeContext("?market=BR&product=spot&account_stage=new_account&funding=Pix&ref=11350287&platform=bitget&locale=pt-BR", { locale: "pt-BR" });
  const results = buildFinderResults({ copy, command, locale: "pt-BR", context });

  assert.equal(searchFinderResults(results, "pix brl", "pt-BR")[0].href, "/br/pix#nxa-context?market=BR&product=spot&account_stage=new_account&funding=Pix");
  assert.equal(searchFinderResults(results, "br cost", "pt-BR")[0].href, "/br/custos#nxa-context?market=BR&product=spot&account_stage=new_account&funding=Pix");
  assert.equal(searchFinderResults(results, "japan", "pt-BR")[0].href, "/ja#nxa-context?market=BR&product=spot&account_stage=new_account&funding=Pix");
  assert.equal(searchFinderResults(results, "korea", "pt-BR")[0].href, "/ko#nxa-context?market=BR&product=spot&account_stage=new_account&funding=Pix");
  assert.equal(searchFinderResults(results, "turkiye", "pt-BR")[0].href, "/pt-br/markets/turkiye#nxa-context?market=BR&product=spot&account_stage=new_account&funding=Pix");

  assert.ok(results.every((entry) => !entry.href.includes("platform=")));
  assert.ok(results.every((entry) => !entry.href.includes("ref=")));
});

test("signup and invitation intent stays on internal registration-path anchors", () => {
  const context = finderSafeContext("?market=BR&product=spot&account_stage=new_account&funding=Pix", { locale: "zh-Hans" });
  const results = buildFinderResults({ copy, command, locale: "zh-Hans", context });
  const invite = searchFinderResults(results, "Bitget 邀请码", "zh-Hans")[0];
  const signup = searchFinderResults(results, "OKX register link", "zh-Hans")[0];

  assert.equal(invite.href, "/zh-hans/exchanges/bitget#registration-path?market=BR&product=spot&account_stage=new_account&funding=Pix&venue=bitget");
  assert.equal(signup.href, "/zh-hans/exchanges/okx#registration-path?market=BR&product=spot&account_stage=new_account&funding=Pix&venue=okx");
  assert.ok(results.every((entry) => entry.href.startsWith("/")));
  assert.ok(results.every((entry) => !/https?:|ref=|invite_code|nexu888|11350287/i.test(entry.href)));
});

test("finder analytics payload never includes raw query, codes, or external links", () => {
  const context = finderSafeContext("?market=BR&product=spot&account_stage=new_account&funding=Pix&utm_campaign=bad", { locale: "zh-Hans" });
  const results = buildFinderResults({ copy, command, locale: "zh-Hans", context });
  const result = searchFinderResults(results, "Bitget 邀请码 nexu888 https://partner.bitget.com/bg/zc8pmupf", "zh-Hans")[0];
  const payload = finderTrackPayload(result, context);

  assert.deepEqual(payload, {
    resultKind: "registration_path",
    routePattern: "/exchanges/:venue#registration-path",
    market: "BR",
    product: "spot",
    locale: "zh-Hans",
  });
  assert.equal(JSON.stringify(payload).includes("nexu888"), false);
  assert.equal(JSON.stringify(payload).includes("partner.bitget"), false);
});
