import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import worker from "../worker/index.js";
import { routeInventory, PRERENDER_LOCALES } from "../scripts/generate-prerender-manifest.mjs";
import { normalizeNewsFeed } from "../src/data/news-feed-client.js";
import { compareDirectAnswerFor } from "../src/data/compare-direct-answers.js";
import { referralSeoFor } from "../src/data/referral-seo.js";
import { parsePublicRoute } from "../src/data/locale-routing.js";

const root = path.resolve(import.meta.dirname, "..");
const indexHtml = await readFile(path.join(root, "dist", "client", "index.html"), "utf8");
const prerenderManifest = await readFile(path.join(root, "dist", "client", "prerender-manifest.json"), "utf8");

// The worker reads the published client asset at runtime. The source feed can
// be refreshed independently during a build, so asserting against `public/`
// would falsely report a stale fingerprint even when the deployable bundle is
// internally consistent.
const newsFeed = await readFile(path.join(root, "dist", "client", "content", "news-feed.json"), "utf8");
const articles = normalizeNewsFeed(JSON.parse(newsFeed));
const newsFeedFingerprint = createHash("sha256").update(newsFeed).digest("hex");

const assets = {
  fetch: async (request) => {
    const url = new URL(request.url);
    if (url.pathname === "/prerender-manifest.json") {
      return new Response(prerenderManifest, {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }
    if (url.pathname === "/content/news-feed.json") return new Response(newsFeed, { headers: { "content-type": "application/json" } });
    if (url.pathname.startsWith("/prerender/")) {
      const body = await readFile(path.join(root, "dist", "client", url.pathname), "utf8");
      return new Response(body, { headers: { "content-type": "application/json" } });
    }
    if (url.pathname === "/index.html") {
      return new Response(indexHtml, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    return new Response("missing", { status: 404 });
  },
};

const representativeStylesheetShell = '<!doctype html><html><head>'
  + '<link rel="modulepreload" href="/assets/route-news.js">'
  + '<link rel="modulepreload" href="/assets/route-v3-pages.js">'
  + '<link rel="stylesheet" href="/assets/route-activity-test.css">'
  + '<link rel="stylesheet" href="/assets/route-v3-campaigns-test.css">'
  + '<link rel="stylesheet" href="/assets/route-news-test.css">'
  + '<link rel="stylesheet" href="/assets/route-methodology-test.css">'
  + '<link rel="stylesheet" href="/assets/route-tokenized-assets-test.css">'
  + '<link rel="stylesheet" href="/assets/route-v3-pages-test.css">'
  + '<link rel="stylesheet" href="/assets/route-v3-home-test.css">'
  + '<link rel="stylesheet" href="/assets/route-v3-wizard-test.css">'
  + '<link rel="stylesheet" href="/assets/route-v3-calculators-test.css">'
  + '<link rel="stylesheet" href="/assets/route-v3-registration-test.css">'
  + '<link rel="stylesheet" href="/assets/route-v3-social-proof-test.css">'
  + '<link rel="stylesheet" href="/assets/route-rates-test.css">'
  + '<link rel="stylesheet" href="/assets/route-market-test.css">'
  + '<link rel="stylesheet" href="/assets/route-onchain-test.css">'
  + '<link rel="stylesheet" href="/assets/route-kol-test.css">'
  + '<link rel="stylesheet" href="/assets/route-telegram-test.css">'
  + '<link rel="stylesheet" href="/assets/route-partners-test.css">'
  + '<link rel="stylesheet" href="/assets/route-topic-guide-test.css">'
  + '<link rel="stylesheet" href="/assets/route-factbook-test.css">'
  + '<link rel="stylesheet" href="/assets/route-international-test.css">'
  + '<link rel="stylesheet" href="/assets/route-embed-test.css">'
  + '<link rel="stylesheet" href="/assets/index-test.css">'
  + '<link rel="stylesheet" href="/assets/shared-decision-rail-test.css">'
  + '<link rel="stylesheet" href="/assets/shared-decision-return-test.css">'
  + '<script type="module" src="/assets/index.js"></script>'
  + '</head><body><div id="root"></div></body></html>';

function assertStylesheetState(body, pathname, keepPrefixes, dropPrefixes) {
  assert.match(body, /index-test\.css/, `${pathname}: shared stylesheet`);
  assert.match(body, /shared-decision-rail-test\.css/, `${pathname}: cross-route decision navigation stylesheet`);
  assert.match(body, /shared-decision-return-test\.css/, `${pathname}: shared scenario copy stylesheet`);
  for (const prefix of keepPrefixes) assert.match(body, new RegExp(`${prefix}test\\.css`), `${pathname}: keeps ${prefix}`);
  for (const prefix of dropPrefixes) assert.doesNotMatch(body, new RegExp(`${prefix}test\\.css`), `${pathname}: drops ${prefix}`);
}

function countStylesheets(html) {
  return (html.match(/<link\b(?=[^>]*rel=["']stylesheet["'])/gi) || []).length;
}

function countDeferredHydrationBridges(html) {
  return (html.match(/\bdata-nexualpha-deferred-hydration\b/g) || []).length;
}

test("prerender manifest covers each route's original content languages", async () => {
  const manifest = JSON.parse(prerenderManifest);
  const inventory = routeInventory(articles);
  assert.equal(Object.keys(manifest.routes).length, inventory.reduce((sum, route) => sum + (route.prerenderLocales || route.locales || PRERENDER_LOCALES).length, 0));
  for (const { pathname, locales = PRERENDER_LOCALES, prerenderLocales } of inventory) {
    for (const locale of prerenderLocales || locales) {
      const route = manifest.routes[`${pathname}|${locale}`];
      assert.ok(route, `${pathname}|${locale}`);
      assert.equal(route.newsArticles, undefined, `${pathname}|${locale}: route index must not inline news articles`);
      const assetPayload = route.html ? { html: route.html } : JSON.parse(await readFile(path.join(root, "dist", "client", route.asset), "utf8"));
      const html = assetPayload.html;
      assert.match(html, /<h1\b/, `${pathname}|${locale}`);
      assert.doesNotMatch(html, /<link\s+rel="preload"\s+as="image"/, `${pathname}|${locale}`);
      if (pathname === "/news" || pathname.startsWith("/news/")) {
        assert.ok(Array.isArray(assetPayload.newsArticles), `${pathname}|${locale}: news articles live in the route asset`);
        assert.match(assetPayload.newsFeedFingerprint || "", /^[a-f0-9]{64}$/i, `${pathname}|${locale}: news fingerprint lives in the route asset`);
        if (pathname === "/news") {
          assert.equal(assetPayload.newsArticles[0]?.content, undefined, `${pathname}|${locale}: list assets use summary-only articles`);
          assert.equal(assetPayload.newsArticles[0]?.sources, undefined, `${pathname}|${locale}: list assets omit source arrays`);
        }
      }
    }
  }
});

test("worker injects readable comparison body with both independent partner CTAs", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/zh-hans/compare/binance-vs-okx", {
    headers: { accept: "text/html" },
  }), { ASSETS: assets });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /<div id="root">[\s\S]*<main[\s\S]*<h1[^>]*>[\s\S]*Binance[\s\S]*OKX[\s\S]*<\/h1>/);
  assert.match(html, /https:\/\/www\.bsmkweb\.cc\/join\?ref=11350287/);
  assert.match(html, /https:\/\/www\.okx\.com\/join\/nexu888/);
  assert.match(html, /<section class="v3-page-hero[\s\S]*<div[^>]*class="v3-versus-card(?:\s[^"]*)?"/);
  assert.match(html, /<details class="v3-versus-stats-disclosure"[^>]*data-testid="compare-versus-stats-binance"[^>]*>[\s\S]*现货费率[\s\S]*0\.10% \/ 0\.10%[\s\S]*查看费率来源/);
  assert.match(html, /<details class="v3-versus-stats-disclosure"[^>]*data-testid="compare-versus-stats-okx"[^>]*>/);
  assert.match(html, /id="compare-faq"[\s\S]*应该先比较哪些费用？[\s\S]*先看本页已审核的现货、合约费率行/);
});

test("worker SSR metadata mirrors the English GSC query-target overrides", async () => {
  const cases = [
    // Owner 2026-10-10: partner profiles lead with the real invite code (src/data/referral-seo.js).
    ["/exchanges/hyperliquid", referralSeoFor("hyperliquid", "en").title],
    ["/exchanges/uniswap", "Uniswap Testnet, Mainnet, Permit2 and Swap Preview Checklist — NexuAlpha"],
    ["/compare/bybit-vs-bitget", compareDirectAnswerFor("bybit-vs-bitget", "en").seoTitle],
  ];

  for (const [pathname, title] of cases) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, {
      headers: { accept: "text/html" },
    }), { ASSETS: assets });
    const html = await response.text();

    assert.equal(response.status, 200, pathname);
    assert.ok(html.includes(`<title translate="no" lang="en">${title.replaceAll("&", "&amp;")}</title>`), pathname);
  }
});

test("worker keeps unsupported app routes as real noindex 404 shells", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/zh-hans/compare/binance-vs-missing", {
    headers: { accept: "text/html" },
  }), { ASSETS: assets });
  const html = await response.text();

  assert.equal(response.status, 404);
  assert.match(html, /name="robots" content="noindex,nofollow"/);
  assert.doesNotMatch(html, /https:\/\/accounts\.binance\.com\/register\?ref=11350287/);
});

test("worker serves the Mexico decision route set with localized metadata", async () => {
  for (const pathname of ["/mx/comparar", "/mx/costos", "/mx/conta"]) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}?locale=es`, { headers: { accept: "text/html" } }), { ASSETS: assets });
    const html = await response.text();
    assert.equal(response.status, 200, pathname);
    assert.match(html, /lang="es"/, pathname);
    assert.match(html, /México/, pathname);
    assert.match(html, /id="nexualpha-prerender-state"/, pathname);
  }
});

test("worker prerenders clean Taiwan and Indonesia country routes with their owner locales", async () => {
  for (const [pathname, locale, localizedCopy] of [["/tw", "zh-Hant", />交易所</], ["/id", "id", />Bursa</]]) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: assets });
    const html = await response.text();
    const textHtml = html.replace(/<!--\s*-->/g, "");
    const statePayload = html.match(/id="nexualpha-prerender-state">([^<]+)<\/script>/)?.[1];

    assert.equal(response.status, 200, pathname);
    assert.match(html, new RegExp(`<html lang="${locale}"`), pathname);
    assert.ok(statePayload, `${pathname}: prerender state`);
    const state = JSON.parse(statePayload);
    assert.equal(state.pathname, pathname, pathname);
    assert.equal(state.locale, locale, pathname);
    assert.match(textHtml, localizedCopy, pathname);
    assert.doesNotMatch(textHtml, />Exchanges</, pathname);
    assert.doesNotMatch(textHtml, />Plataformas</, pathname);
    assert.doesNotMatch(textHtml, />거래소</, pathname);
  }
});

test("worker prerenders the clean Hong Kong country route with its Traditional Chinese owner locale", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/hk", { headers: { accept: "text/html" } }), { ASSETS: assets });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /<html lang="zh-Hant"/);
  assert.match(html, /id="nexualpha-prerender-state">{"pathname":"\/hk","locale":"zh-Hant"/);
  assert.match(html.replace(/<!--\s*-->/g, ""), />交易所</);
});

test("worker prerenders Spanish MX owners and explicit English display documents without mixed language", async () => {
  for (const path of ["/mx", "/mx/comparar", "/mx/costos", "/mx/conta"]) {
    for (const locale of ["es", "en"]) {
      const pathname = locale === "en" ? `${path}?locale=en&market=MX&product=spot&account_stage=another_platform&funding=SPEI` : path;
      const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: assets });
      const html = await response.text();
      const textHtml = html.replace(/<!--\s*-->/g, "");
      const statePayload = html.match(/id="nexualpha-prerender-state">([^<]+)<\/script>/)?.[1];
      assert.equal(response.status, 200, pathname);
      assert.match(html, new RegExp(`<html lang="${locale}"`), pathname);
      assert.ok(html.includes(`<link rel="canonical" href="https://nexualpha.com${path}"`), pathname);
      const robots = locale === "es" && path === "/mx" ? "index,follow" : "noindex,follow";
      assert.ok(html.includes(`name="robots" content="${robots}"`), pathname);
      assert.ok(statePayload, `${pathname}: prerender state`);
      const state = JSON.parse(statePayload);
      assert.equal(state.pathname, path, pathname);
      assert.equal(state.locale, locale, pathname);
      assert.match(textHtml, locale === "en" ? />Exchanges</ : />Plataformas</, pathname);
      assert.match(textHtml, locale === "en" ? /<h1[^>]*>Mexico:/ : /<h1[^>]*>México:/, pathname);
      assert.doesNotMatch(textHtml, locale === "en" ? /<h1[^>]*>México:/ : /<h1[^>]*>Mexico:/, pathname);
      const manifest = JSON.parse(prerenderManifest);
      if (locale === "en") assert.equal(manifest.routes[`${path}|en`].searchPublished, false, pathname);
    }
  }
});

test("worker prerenders clean Japan and Korea country routes with their owner locales", async () => {
  const cases = [
    ["/jp", "ja", /日本|JPY|本人確認|Japan/],
    ["/kr", "ko", /한국|KRW|실명|Korea/],
  ];

  for (const [pathname, locale, localizedText] of cases) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: assets });
    const html = await response.text();
    const statePayload = html.match(/id="nexualpha-prerender-state">([^<]+)<\/script>/)?.[1];

    assert.equal(response.status, 200, pathname);
    assert.match(html, new RegExp(`<html lang="${locale}"`), pathname);
    assert.ok(statePayload, `${pathname}: prerender state`);
    const state = JSON.parse(statePayload);
    assert.equal(state.pathname, pathname, pathname);
    assert.equal(state.locale, locale, pathname);
    assert.match(html, localizedText, pathname);
    assert.doesNotMatch(html, /<script type="module"/, pathname);
    assert.match(html, /data-nexualpha-deferred-hydration/, pathname);
  }
});

test("regional JP KR and Türkiye routes ship full SSR with delayed hydration budgets", async () => {
  const parserCases = [
    ["/jp", { contentPathname: "/jp", locale: "ja", localeSource: "market", isCountryRoute: true }],
    ["/kr", { contentPathname: "/kr", locale: "ko", localeSource: "market", isCountryRoute: true }],
    ["/tr/markets/turkiye", { contentPathname: "/markets/turkiye", locale: "tr", localeSource: "path", isCountryRoute: false }],
  ];

  for (const [pathname, expectedRoute] of parserCases) {
    const parsedRoute = parsePublicRoute(pathname, new URLSearchParams());
    assert.equal(parsedRoute.contentPathname, expectedRoute.contentPathname, `${pathname}: content route`);
    assert.equal(parsedRoute.locale, expectedRoute.locale, `${pathname}: locale`);
    assert.equal(parsedRoute.localeSource, expectedRoute.localeSource, `${pathname}: locale source`);
    assert.equal(parsedRoute.isCountryRoute, expectedRoute.isCountryRoute, `${pathname}: country route classification`);

    const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: assets });
    const html = await response.text();
    const statePayload = html.match(/id="nexualpha-prerender-state">([^<]+)<\/script>/)?.[1];
    const state = statePayload ? JSON.parse(statePayload) : null;

    assert.equal(response.status, 200, `${pathname}: response status`);
    assert.match(html, /<div id="root">[\s\S]*<main\b[\s\S]*<h1\b/, `${pathname}: full SSR main content`);
    assert.doesNotMatch(html, /<div id="root"><\/div>/, `${pathname}: no empty app shell`);
    assert.doesNotMatch(html, /data-nexualpha-client-render="true"/, `${pathname}: no client-render fallback`);
    assert.ok(state, `${pathname}: prerender state`);
    assert.equal(state.locale, expectedRoute.locale, `${pathname}: prerender locale`);
    assert.equal(countDeferredHydrationBridges(html), 1, `${pathname}: one deferred hydration bridge`);
    assert.equal((html.match(/<script\b(?=[^>]*type=["']module["'])/gi) || []).length, 0, `${pathname}: no first-screen module script`);
    assert.ok(countStylesheets(html) <= 4, `${pathname}: stylesheet budget <= 4`);
  }
});

test("worker serves the international SSR locale set", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/ja/topics/derivatives", {
    headers: { accept: "text/html" },
  }), { ASSETS: assets });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /<div id="root">[\s\S]*<h1\b/);
  assert.match(html, /id="nexualpha-prerender-state"/);

  const arabicResponse = await worker.fetch(new Request("https://nexualpha.com/exchanges/binance?locale=ar", {
    headers: { accept: "text/html" },
  }), { ASSETS: assets });
  await arabicResponse.text();
  assert.equal(arabicResponse.status, 308);
  assert.equal(arabicResponse.headers.get("location"), "https://nexualpha.com/ar/exchanges/binance");
});

test("worker prerenders path-locale high-intent routes with market and product context", async () => {
  const cases = [
    ["/es/compare/binance-vs-okx?market=MX&product=spot", /<h1[^>]*>[\s\S]*Binance[\s\S]*OKX[\s\S]*<\/h1>/, /data-cta-placement|www\.bsmkweb\.cc|okx\.com\/join/],
    ["/tr/compare/bybit-vs-bitget?market=TR&product=spot", /<h1[^>]*>[\s\S]*Bybit[\s\S]*Bitget[\s\S]*<\/h1>/, /data-cta-placement|bybit\.com\/register|partner\.bitget\.cafe/],
    ["/pt-br/rates?market=BR&product=spot", /<h1[^>]*>[\s\S]*Painel de referência de taxas[\s\S]*<\/h1>/, /data-cta-placement|partner\.bitget\.cafe|backpack\.exchange\/join/],
    ["/es/factbook/binance?market=MX&product=spot", /<h1[^>]*>[\s\S]*Binance[\s\S]*Factbook[\s\S]*<\/h1>/, /data-cta-placement|www\.bsmkweb\.cc|registration-path/],
  ];

  for (const [path, h1Pattern, ctaPattern] of cases) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${path}`, {
      headers: { accept: "text/html" },
    }), { ASSETS: assets });
    const html = await response.text();

    assert.equal(response.status, 200, path);
    assert.match(html, /<div id="root">[\s\S]*<main\b/, path);
    assert.match(html, h1Pattern, path);
    assert.match(html, /id="nexualpha-prerender-state"/, path);
    assert.match(html, ctaPattern, path);
    assert.doesNotMatch(html, /<div id="root"><\/div>/, path);
  }
});

test("worker does not prerender campaign or attribution query routes as the homepage", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/?ref=binance&utm_source=telegram", {
    headers: { accept: "text/html" },
  }), { ASSETS: assets });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /<div id="root"><\/div>/);
  assert.doesNotMatch(html, /id="nexualpha-prerender-state"/);
});

test("worker serves a fingerprint-matched prerendered news detail without requesting the runtime feed", async () => {
  const article = articles[0];
  const pathname = `/news/${article.slug}`;
  let feedRequests = 0;
  const html = "<!doctype html><html><head><title>Shell</title></head><body><div id=\"root\"></div></body></html>";
  const articleHtml = `<main><h1>${article.title.en}</h1><p>Prerendered first viewport body.</p></main>`;
  const articleAsset = `/prerender/en/news/${article.slug}.json`;
  const manifest = {
    version: "nexualpha-prerender-v1",
    routes: {
      [`${pathname}|en`]: {
        pathname,
        locale: "en",
        asset: articleAsset,
        newsFeedFingerprint,
      },
    },
  };
  const noFeedAssets = {
    async fetch(request) {
      const requestPath = new URL(request.url).pathname;
      if (requestPath === "/prerender-manifest.json") return Response.json(manifest);
      if (requestPath === articleAsset) return Response.json({ html: articleHtml, newsArticles: [article], newsFeedFingerprint });
      if (requestPath === "/content/news-feed.sha256.txt") return new Response(newsFeedFingerprint);
      if (requestPath === "/content/news-feed.json") {
        feedRequests += 1;
        return new Response("feed should not be needed for matched prerender", { status: 503 });
      }
      if (requestPath === "/index.html") {
        return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
      }
      return new Response("missing", { status: 404 });
    },
  };

  const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, {
    headers: { accept: "text/html" },
  }), { ASSETS: noFeedAssets });
  const body = await response.text();

  assert.equal(feedRequests, 0);
  assert.equal(response.status, 200);
  assert.match(body, /Prerendered first viewport body/);
  assert.match(body, /id="nexualpha-prerender-state"/);
});

test("worker keeps prerendered news hydration state when analytics_test is present", async () => {
  const article = articles.find((item) => item.slug === "hyperliquid-vs-dydx") || articles[0];
  const pathname = `/news/${article.slug}`;
  let feedRequests = 0;
  const html = "<!doctype html><html><head><title>Shell</title></head><body><div id=\"root\"></div></body></html>";
  const articleHtml = `<main><h1>${article.title.en}</h1><p>Prerendered article body.</p></main>`;
  const articleAsset = `/prerender/en/news/${article.slug}.json`;
  const summaryOnlyFeed = JSON.stringify({
    articles: [{
      slug: article.slug,
      status: article.status,
      category: article.category,
      categoryName: article.categoryName,
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt,
      readTime: article.readTime,
      author: article.author,
      title: article.title,
      summary: article.summary,
      relatedVenues: article.relatedVenues,
      availableLocales: article.availableLocales,
    }],
  });
  const manifest = {
    version: "nexualpha-prerender-v1",
    routes: {
      [`${pathname}|en`]: {
        pathname,
        locale: "en",
        asset: articleAsset,
        newsFeedFingerprint,
      },
    },
  };
  const queryAssets = {
    async fetch(request) {
      const requestPath = new URL(request.url).pathname;
      if (requestPath === "/prerender-manifest.json") return Response.json(manifest);
      if (requestPath === articleAsset) return Response.json({ html: articleHtml, newsArticles: [article], newsFeedFingerprint });
      if (requestPath === "/content/news-feed.sha256.txt") return new Response(newsFeedFingerprint);
      if (requestPath === "/content/news-feed.json") {
        feedRequests += 1;
        return new Response(summaryOnlyFeed, { headers: { "content-type": "application/json" } });
      }
      if (requestPath === "/index.html") {
        return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
      }
      return new Response("missing", { status: 404 });
    },
  };

  const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}?analytics_test=1`, {
    headers: { accept: "text/html" },
  }), { ASSETS: queryAssets });
  const body = await response.text();
  const statePayload = body.match(/id="nexualpha-prerender-state">([^<]+)<\/script>/)?.[1];
  const state = statePayload ? JSON.parse(statePayload) : null;

  assert.equal(response.status, 200);
  assert.equal(feedRequests, 0);
  assert.match(body, /Prerendered article body/);
  assert.ok(state, "expected prerender hydration state for analytics_test route");
  assert.equal(state.newsArticles?.[0]?.slug, article.slug);
  assert.ok(state.newsArticles?.[0]?.content?.en, "hydration state must include article content");
});

test("worker injects one article hydration state for non-prerendered localized news detail fallbacks", async () => {
  const article = articles.find((item) => item.slug === "hyperliquid-vs-dydx") || articles[0];
  const html = "<!doctype html><html><head><title>Shell</title></head><body><div id=\"root\"></div></body></html>";
  const manifest = { version: "nexualpha-prerender-v1", routes: {} };
  const fallbackAssets = {
    async fetch(request) {
      const requestPath = new URL(request.url).pathname;
      if (requestPath === "/prerender-manifest.json") return Response.json(manifest);
      if (requestPath === "/content/news-feed.json") return new Response(newsFeed, { headers: { "content-type": "application/json" } });
      if (requestPath === "/index.html") return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
      return new Response("missing", { status: 404 });
    },
  };

  for (const prefix of ["", "zh-hant", "ja"]) {
    const pathPrefix = prefix ? `/${prefix}` : "";
    const response = await worker.fetch(new Request(`https://nexualpha.com${pathPrefix}/news/${article.slug}?analytics_test=1`, {
      headers: { accept: "text/html" },
    }), { ASSETS: fallbackAssets });
    const body = await response.text();
    const statePayload = body.match(/id="nexualpha-prerender-state">([^<]+)<\/script>/)?.[1];
    const state = statePayload ? JSON.parse(statePayload) : null;

    assert.equal(response.status, 200, prefix);
    assert.match(body, /data-nexualpha-client-render="true"/, prefix);
    assert.match(body, /data-nexualpha-ssr-fallback="news-detail"/, prefix);
    assert.ok(state, `${prefix}: expected fallback hydration state`);
    assert.equal(state.locale, prefix === "zh-hant" ? "zh-Hant" : (prefix || "en"));
    assert.equal(state.newsArticles?.length, 1);
    assert.equal(state.newsArticles?.[0]?.slug, article.slug);
    assert.ok(state.newsArticles?.[0]?.content?.en || state.newsArticles?.[0]?.content?.["zh-Hans"], `${prefix}: expected article content in state`);
  }
});

test("worker keeps localized news list fallback summary-only and without hydration article bodies", async () => {
  const html = "<!doctype html><html><head><title>Shell</title></head><body><div id=\"root\"></div></body></html>";
  const manifest = { version: "nexualpha-prerender-v1", routes: {} };
  const fallbackAssets = {
    async fetch(request) {
      const requestPath = new URL(request.url).pathname;
      if (requestPath === "/prerender-manifest.json") return Response.json(manifest);
      if (requestPath === "/content/news-feed.json") return new Response(newsFeed, { headers: { "content-type": "application/json" } });
      if (requestPath === "/index.html") return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
      return new Response("missing", { status: 404 });
    },
  };

  const response = await worker.fetch(new Request("https://nexualpha.com/zh-hant/news?analytics_test=1", {
    headers: { accept: "text/html" },
  }), { ASSETS: fallbackAssets });
  const body = await response.text();

  const statePayload = body.match(/id="nexualpha-prerender-state">([^<]+)<\/script>/)?.[1];
  const state = statePayload ? JSON.parse(statePayload) : null;

  assert.equal(response.status, 200);
  assert.match(body, /data-nexualpha-client-render="true"/);
  assert.match(body, /data-nexualpha-ssr-fallback="news-list"/);
  assert.ok(state, "expected list fallback hydration state");
  assert.equal(state.locale, "zh-Hant");
  assert.ok(state.newsArticles?.length > 0, "expected summary rows in hydration state");
  assert.equal(state.newsArticles[0].content, undefined, "list hydration must remain summary-only");
  assert.equal(state.newsArticles[0].sources, undefined, "list hydration must not include article sources");
});

test("worker keeps unknown localized news detail fallback as a real 404 without article state", async () => {
  const html = "<!doctype html><html><head><title>Shell</title></head><body><div id=\"root\"></div></body></html>";
  const manifest = { version: "nexualpha-prerender-v1", routes: {} };
  const fallbackAssets = {
    async fetch(request) {
      const requestPath = new URL(request.url).pathname;
      if (requestPath === "/prerender-manifest.json") return Response.json(manifest);
      if (requestPath === "/content/news-feed.json") return new Response(newsFeed, { headers: { "content-type": "application/json" } });
      if (requestPath === "/index.html") return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
      return new Response("missing", { status: 404 });
    },
  };

  const response = await worker.fetch(new Request("https://nexualpha.com/ja/news/not-a-real-article?analytics_test=1", {
    headers: { accept: "text/html" },
  }), { ASSETS: fallbackAssets });
  const body = await response.text();

  assert.equal(response.status, 404);
  assert.doesNotMatch(body, /id="nexualpha-prerender-state"/);
  assert.match(body, /Article Not Found|Page Not Found|<title translate="no" lang="en">Article Not Found/);
});

test("worker removes broad modulepreload hints from server-rendered article HTML", async () => {
  const article = articles[0];
  const pathname = `/news/${article.slug}`;
  const shell = '<!doctype html><html><head><link rel="modulepreload" href="/assets/route-activity.js"><link rel="stylesheet" href="/assets/route-activity-old.css"><link rel="stylesheet" href="/assets/route-news-current.css"><link rel="stylesheet" href="/assets/index-current.css"><script type="module" src="/assets/index.js"></script></head><body><div id="root"></div></body></html>';
  const manifest = { version: "nexualpha-prerender-v1", routes: { [`${pathname}|en`]: {
    pathname, locale: "en", html: `<main><h1>${article.title.en}</h1></main>`, newsArticles: [article], newsFeedFingerprint,
  } } };
  const hintAssets = { async fetch(request) {
    const requestPath = new URL(request.url).pathname;
    if (requestPath === "/prerender-manifest.json") return Response.json(manifest);
    if (requestPath === "/content/news-feed.sha256.txt") return new Response(newsFeedFingerprint);
    if (requestPath === "/index.html") return new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } });
    return new Response("missing", { status: 404 });
  } };
  const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: hintAssets });
  const body = await response.text();
  assert.doesNotMatch(body, /rel="modulepreload"/);
  assert.doesNotMatch(body, /route-activity-old\.css/);
  assert.match(body, /route-news-current\.css/);
  assert.match(body, /index-current\.css/);
  assert.doesNotMatch(body, /<script type="module"/);
  assert.match(body, /data-nexualpha-deferred-hydration/);
  assert.match(body, /import\(s\)/);
});

test("worker trims route assets and defers hydration for localized news fallbacks", async () => {
  const fallbackAssets = { async fetch(request) {
    const requestPath = new URL(request.url).pathname;
    if (requestPath === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
    if (requestPath === "/content/news-feed.json") return new Response(newsFeed, { headers: { "content-type": "application/json" } });
    if (requestPath === "/index.html") return new Response(representativeStylesheetShell, { headers: { "content-type": "text/html; charset=utf-8" } });
    return new Response("missing", { status: 404 });
  } };

  const response = await worker.fetch(new Request("https://nexualpha.com/ja/news", {
    headers: { accept: "text/html" },
  }), { ASSETS: fallbackAssets });
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(body, /data-nexualpha-client-render="true"/);
  assert.doesNotMatch(body, /rel="modulepreload"/);
  assert.match(body, /route-news-test\.css/);
  assert.doesNotMatch(body, /route-activity-test\.css/);
  assert.match(body, /index-test\.css/);
  assert.doesNotMatch(body, /route-v3-home-test\.css/);
  assert.doesNotMatch(body, /<script type="module" src="\/assets\/index\.js"><\/script>/);
  assert.match(body, /data-nexualpha-deferred-hydration/);
  const statePayload = body.match(/id="nexualpha-prerender-state">([^<]+)<\/script>/)?.[1];
  const state = statePayload ? JSON.parse(statePayload) : null;
  assert.ok(state, "expected fallback hydration state");
  assert.equal(state.locale, "ja");
  assert.ok(state.newsArticles?.length > 0, "expected summary rows in hydration state");
  assert.equal(state.newsArticles[0].content, undefined, "list hydration must remain summary-only");
});

test("worker defers broad JavaScript hints on the prerendered homepage while retaining styles", async () => {
  const shell = '<!doctype html><html><head><link rel="modulepreload" href="/assets/route-news.js"><link rel="modulepreload" href="/assets/route-v3-pages.js"><link rel="stylesheet" href="/assets/route-news-test.css"><link rel="stylesheet" href="/assets/route-v3-home-test.css"><link rel="stylesheet" href="/assets/index-test.css"><script type="module" src="/assets/index.js"></script></head><body><div id="root"></div></body></html>';
  const manifest = { version: "nexualpha-prerender-v1", routes: { "/|en": {
    pathname: "/", locale: "en", asset: "/prerender/en/home.json",
  } } };
  const assets = { async fetch(request) {
    const requestPath = new URL(request.url).pathname;
    if (requestPath === "/prerender-manifest.json") return Response.json(manifest);
    if (requestPath === "/prerender/en/home.json") return Response.json({ html: "<main><h1>Independent platform comparison</h1></main>" });
    if (requestPath === "/index.html") return new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } });
    return new Response("missing", { status: 404 });
  } };

  const response = await worker.fetch(new Request("https://nexualpha.com/", { headers: { accept: "text/html" } }), { ASSETS: assets });
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(body, /Independent platform comparison/);
  assert.match(body, /id="nexualpha-prerender-state"/);
  assert.doesNotMatch(body, /rel="modulepreload"/);
  assert.doesNotMatch(body, /route-news-test\.css/);
  assert.match(body, /route-v3-home-test\.css/);
  assert.match(body, /index-test\.css/);
  assert.doesNotMatch(body, /<script type="module"/);
  assert.match(body, /data-nexualpha-deferred-hydration/);
});

test("worker applies homepage resource deferral to migrated locale paths", async () => {
  const shell = '<!doctype html><html><head><link rel="modulepreload" href="/assets/route-news.js"><link rel="stylesheet" href="/assets/index.css"><script type="module" src="/assets/index.js"></script></head><body><div id="root"></div></body></html>';
  const manifest = { version: "nexualpha-prerender-v1", routes: { "/|ja": {
    pathname: "/", locale: "ja", asset: "/prerender/ja/home.json",
  } } };
  const assets = { async fetch(request) {
    const requestPath = new URL(request.url).pathname;
    if (requestPath === "/prerender-manifest.json") return Response.json(manifest);
    if (requestPath === "/prerender/ja/home.json") return Response.json({ html: "<main><h1>世界のプラットフォーム比較</h1></main>" });
    if (requestPath === "/index.html") return new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } });
    return new Response("missing", { status: 404 });
  } };

  const response = await worker.fetch(new Request("https://nexualpha.com/ja", { headers: { accept: "text/html" } }), { ASSETS: assets });
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(body, /世界のプラットフォーム比較/);
  assert.doesNotMatch(body, /rel="modulepreload"/);
  assert.doesNotMatch(body, /<script type="module"/);
  assert.match(body, /data-nexualpha-deferred-hydration/);
});

test("homepage SSR retains registration card CSS before deferred hydration in its content languages", async () => {
  for (const locale of ["en", "ja", "ko", "tr", "ar"]) {
    const asset = `/prerender/${locale}/home.json`;
    const manifest = { version: "nexualpha-prerender-v1", routes: { [`/|${locale}`]: {
      pathname: "/", locale, asset,
    } } };
    const ASSETS = { async fetch(request) {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/prerender-manifest.json") return Response.json(manifest);
      if (pathname === asset) return Response.json({ html: '<main><h1>Platform comparison</h1><div class="registration-card registration-card--compact"><span class="registration-card__code-value">11350287</span></div></main>' });
      if (pathname === "/index.html") return new Response(representativeStylesheetShell, { headers: { "content-type": "text/html; charset=utf-8" } });
      return new Response("missing", { status: 404 });
    } };
    const pathname = locale === "en" ? "/" : `/${locale}`;
    const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), { ASSETS });
    const html = await response.text();
    assert.equal(response.status, 200, pathname);
    assert.match(html, /<link rel="stylesheet" href="\/assets\/route-v3-registration-test\.css">/, `${pathname}: registration styles precede hydration`);
    assert.match(html, /registration-card__code-value/);
    assert.match(html, /data-nexualpha-deferred-hydration/);
    assert.doesNotMatch(html, /<script type="module"|rel="modulepreload"/);
    assert.doesNotMatch(html, /route-news-test\.css/);
  }
});

test("worker filters stylesheets by prerendered route while retaining shared base CSS", async () => {
  const articleSlug = articles[0].slug;
  const tokenizedTreasuryArticleSlug = articles.find((article) => String(article.slug).startsWith("tokenized-treasuries"))?.slug || articleSlug;
  const cases = [
    ["/", "/prerender/en/home.json", "<main><h1>Independent platform comparison</h1><button data-cta-placement=\"home-open\">Open</button></main>", ["route-v3-home-", "route-v3-wizard-", "route-v3-pages-", "route-v3-registration-", "route-v3-calculators-", "route-v3-campaigns-", "route-v3-social-proof-", "route-international-", "route-rates-", "route-activity-", "route-onchain-", "route-telegram-", "route-market-"]],
    ["/exchanges", "/prerender/en/exchanges.json", "<main><h1>Exchange directory</h1><button data-cta-placement=\"directory-open\">Open</button></main>", ["route-v3-pages-"]],
    ["/exchanges/binance", "/prerender/en/binance.json", "<main><h1>Binance review</h1><button data-cta-placement=\"venue-register\">Register</button><a href=\"/methodology\">Methodology</a></main>", ["route-v3-pages-", "route-v3-registration-", "route-activity-"]],
    ["/compare/binance-vs-okx", "/prerender/en/compare.json", "<main><h1>Binance vs OKX</h1><button data-cta-placement=\"compare-open\">Compare</button></main>", ["route-v3-pages-"]],
    ["/mx/comparar", "/prerender/es/mx/comparar.json", "<main><h1>Comparar México</h1><button data-cta-placement=\"mx-compare\">Open</button></main>", ["route-v3-pages-"], "es"],
    ["/mx/conta", "/prerender/es/mx/conta.json", "<main><h1>Cuenta México</h1><button data-cta-placement=\"mx-account\">Open</button></main>", ["route-v3-pages-"], "es"],
    ["/mx/costos", "/prerender/es/mx/costos.json", "<main><h1>Costos México</h1><button data-cta-placement=\"mx-costs\">Open</button></main>", ["route-rates-", "route-activity-"], "es"],
    ["/methodology", "/prerender/en/methodology.json", "<main><h1>Research Methodology</h1><button data-cta-placement=\"methodology-open\">Open</button><a href=\"/exchanges\">Directory</a></main>", ["route-methodology-"]],
    ["/news", "/prerender/en/news.json", "<main><h1>Market News</h1><button data-cta-placement=\"news-filter\">Filter</button><a href=\"/news/example\">Example</a></main>", ["route-news-"]],
    [`/news/${articleSlug}`, `/prerender/en/news/${articleSlug}.json`, "<main><h1>News detail</h1><button data-cta-placement=\"news-detail\">Read</button></main>", ["route-news-"]],
    [`/news/${tokenizedTreasuryArticleSlug}`, `/prerender/en/news/${tokenizedTreasuryArticleSlug}.json`, "<main><h1>Tokenized Treasuries detail</h1><button data-cta-placement=\"tokenized-detail\">Read</button></main>", ["route-news-"]],
    ["/partners", "/prerender/en/partners.json", "<main><h1>Partner Embeds</h1><button data-cta-placement=\"partner-open\">Open</button></main>", ["route-partners-"]],
    ["/partners/embed-guide", "/prerender/en/partners-guide.json", "<main><h1>Partner Guide</h1><button data-cta-placement=\"partner-guide\">Open</button></main>", ["route-partners-"]],
    ["/rates", "/prerender/en/rates.json", "<main><h1>Rates</h1><button data-cta-placement=\"rates-open\">Open</button></main>", ["route-rates-", "route-activity-"]],
    ["/onchain", "/prerender/en/onchain.json", "<main><h1>Onchain</h1><button data-cta-placement=\"onchain-open\">Open</button></main>", ["route-onchain-"]],
    ["/factbook/binance", "/prerender/en/factbook/binance.json", "<main><h1>Factbook</h1><button data-cta-placement=\"factbook-open\">Open</button></main>", ["route-factbook-", "route-activity-"]],
    ["/jp", "/prerender/ja/jp.json", "<main><h1>Japan regional preview</h1><button data-cta-placement=\"jp-open\">Open</button></main>", ["route-international-"], "ja"],
    ["/br", "/prerender/pt-BR/br.json", "<main><h1>Brasil regional preview</h1><button data-cta-placement=\"br-open\">Open</button></main>", ["route-international-"], "pt-BR"],
    ["/tr/markets/turkiye", "/prerender/tr/markets/turkiye.json", "<main><h1>Türkiye regional preview</h1><button data-cta-placement=\"tr-open\">Open</button></main>", ["route-international-"], "tr"],
    ["/telegram", "/prerender/en/telegram.json", "<main><h1>Telegram</h1><button data-cta-placement=\"telegram-open\">Open</button></main>", ["route-telegram-"]],
    ["/activities", "/prerender/en/activities.json", "<main><h1>Activities</h1><button data-cta-placement=\"activity-open\">Open</button></main>", ["route-activity-"]],
    ["/activities/research/binance", "/prerender/en/activities/research/binance.json", "<main><h1>Activity research</h1><button data-cta-placement=\"activity-research\">Open</button></main>", ["route-activity-"]],
    ["/topics/meme-coins", "/prerender/en/topics/meme-coins.json", "<main><h1>Meme coins</h1><button data-cta-placement=\"topic-open\">Open</button></main>", ["route-topic-guide-"]],
    ["/topics/derivatives", "/prerender/en/topics/derivatives.json", "<main><h1>Derivatives</h1><button data-cta-placement=\"derivatives-open\">Open</button></main>", ["route-topic-guide-", "route-v3-pages-"]],
    ["/topics/tokenized-assets", "/prerender/en/topics/tokenized-assets.json", "<main><h1>Tokenized Assets</h1><button data-cta-placement=\"tokenized-assets-topic\">Open</button></main>", ["route-tokenized-assets-"]],
    ["/topics/tokenized-treasuries", "/prerender/en/topics/tokenized-treasuries.json", "<main><h1>Tokenized Treasuries</h1><button data-cta-placement=\"tokenized-topic\">Open</button></main>", ["route-tokenized-assets-"]],
    ["/topics/tokenized-stocks-vs-perpetuals", "/prerender/en/topics/tokenized-stocks-vs-perpetuals.json", "<main><h1>Tokenized Stocks vs Perpetuals</h1><button data-cta-placement=\"tokenized-stocks-topic\">Open</button></main>", ["route-tokenized-assets-"]],
    ["/ref/partner", "/prerender/en/ref/partner.json", "<main><h1>Partner desk</h1><button data-cta-placement=\"ref-open\">Open</button></main>", ["route-kol-"]],
  ];
  const allRoutePrefixes = [
    "route-activity-", "route-v3-campaigns-", "route-news-", "route-methodology-", "route-tokenized-assets-", "route-v3-pages-", "route-v3-home-",
    "route-v3-wizard-", "route-v3-calculators-", "route-v3-registration-", "route-v3-social-proof-",
    "route-rates-", "route-market-", "route-onchain-", "route-kol-", "route-telegram-", "route-partners-", "route-topic-guide-",
    "route-factbook-", "route-international-", "route-embed-",
  ];
  const manifestKeyPath = (pathname) => pathname === "/partners/embed-guide"
    ? "/partners"
    : pathname.replace(/^\/tr(?=\/)/, "");
  const manifest = {
    version: "nexualpha-prerender-v1",
    routes: Object.fromEntries(cases.map(([pathname, asset,, , locale = "en"]) => {
      const routePathname = manifestKeyPath(pathname);
      return [`${routePathname}|${locale}`, { pathname: routePathname, locale, asset, ...((routePathname === "/news" || routePathname.startsWith("/news/")) ? { newsArticles: articles, newsFeedFingerprint } : {}) }];
    })),
  };
  const payloadByAsset = Object.fromEntries(cases.map(([, asset, html]) => [asset, { html }]));
  const deferralAssets = { async fetch(request) {
    const requestPath = new URL(request.url).pathname;
    if (requestPath === "/prerender-manifest.json") return Response.json(manifest);
    if (requestPath === "/content/brazil-metadata.json") return Response.json({
      version: 1,
      pages: {
        "/br": {
          status: 200,
          title: "Brasil regional preview",
          description: "Brazil regional preview.",
          canonical: "https://nexualpha.com/br",
          locale: "pt-BR",
          schemas: null,
        },
      },
    });
    if (requestPath === "/content/news-feed.sha256.txt") return new Response(newsFeedFingerprint);
    if (payloadByAsset[requestPath]) return Response.json(payloadByAsset[requestPath]);
    if (requestPath === "/index.html") return new Response(representativeStylesheetShell, { headers: { "content-type": "text/html; charset=utf-8" } });
    return new Response("missing", { status: 404 });
  } };

  for (const [pathname,,, keepPrefixes, locale = "en"] of cases) {
    const query = locale === "en" || pathname === "/br" || pathname.startsWith("/br/") || pathname.startsWith(`/${locale}/`)
      ? ""
      : `?locale=${encodeURIComponent(locale)}`;
    const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}${query}`, { headers: { accept: "text/html" } }), { ASSETS: deferralAssets });
    const body = await response.text();
    assert.equal(response.status, 200, pathname);
    assert.match(body, /id="nexualpha-prerender-state"/, pathname);
    assert.doesNotMatch(body, /rel="modulepreload"/, pathname);
    assertStylesheetState(body, pathname, keepPrefixes, allRoutePrefixes.filter((prefix) => !keepPrefixes.includes(prefix)));
    assert.doesNotMatch(body, /<script type="module"/, pathname);
    assert.match(body, /data-nexualpha-deferred-hydration/, pathname);
    assert.match(body, /import\(s\)/, pathname);
    assert.match(body, /stopImmediatePropagation/, pathname);
    assert.match(body, /requestAnimationFrame/, pathname);
    assert.match(body, /closest\?\.\("button"\)/, pathname);
    assert.doesNotMatch(body, /closest\?\.\("a"\)/, pathname);
  }
});

test("prerendered embedded calculator protects first input while keeping eager module loading", async () => {
  const shell = '<!doctype html><html><head><link rel="modulepreload" href="/assets/route-calculator.js"><link rel="stylesheet" href="/assets/index.css"><script type="module" src="/assets/index.js"></script></head><body><div id="root"></div></body></html>';
  const manifest = { version: "nexualpha-prerender-v1", routes: { "/embed/calculator|en": {
    pathname: "/embed/calculator", locale: "en", asset: "/prerender/en/embed-calculator.json",
  } } };
  const embedAssets = { async fetch(request) {
    const requestPath = new URL(request.url).pathname;
    if (requestPath === "/prerender-manifest.json") return Response.json(manifest);
    if (requestPath === "/prerender/en/embed-calculator.json") return Response.json({ html: '<template data-nexualpha-scope-start="embed-content"></template><main><h1>Fee calculator</h1><input type="number" aria-label="Volume" /></main><template data-nexualpha-scope-end="embed-content"></template>' });
    if (requestPath === "/index.html") return new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } });
    return new Response("missing", { status: 404 });
  } };
  const response = await worker.fetch(new Request("https://nexualpha.com/embed/calculator?analytics_test=1", { headers: { accept: "text/html" } }), { ASSETS: embedAssets });
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(body, /id="nexualpha-prerender-state"/);
  assert.match(body, /data-nexualpha-scope-start="embed-content"/);
  assert.match(body, /data-nexualpha-deferred-hydration/);
  assert.match(body, /rel="modulepreload"/);
  assert.match(body, /<script type="module" src="\/assets\/index\.js"><\/script>/);
  assert.ok(body.indexOf('data-nexualpha-deferred-hydration') < body.indexOf('<script type="module"'), "capture bridge must be installed before the eager module");
  assert.equal((body.match(/data-nexualpha-deferred-hydration/g) || []).length, 1);
});

test("decision-passport query routes hydrate eagerly so query state becomes visible", async () => {
  const shell = '<!doctype html><html><head><script type="module" src="/assets/index.js"></script></head><body><div id="root"></div></body></html>';
  const manifest = { version: "nexualpha-prerender-v1", routes: { "/exchanges/bitget|zh-Hant": {
    pathname: "/exchanges/bitget", locale: "zh-Hant", asset: "/prerender/zh-Hant/exchanges-bitget.json",
  } } };
  const assets = { async fetch(request) {
    const requestPath = new URL(request.url).pathname;
    if (requestPath === "/prerender-manifest.json") return Response.json(manifest);
    if (requestPath === "/prerender/zh-Hant/exchanges-bitget.json") return Response.json({ html: '<main><h1>Bitget</h1></main>' });
    if (requestPath === "/index.html") return new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } });
    return new Response("missing", { status: 404 });
  } };
  const response = await worker.fetch(new Request("https://nexualpha.com/zh-hant/exchanges/bitget?market=HK&product=spot&account_stage=new_account&funding=HKD%20bank%20transfer", { headers: { accept: "text/html" } }), { ASSETS: assets });
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(body, /data-nexualpha-deferred-hydration/);
  assert.match(body, /<script type="module" src="\/assets\/index\.js"><\/script>/);
  assert.ok(body.indexOf('data-nexualpha-deferred-hydration') < body.indexOf('<script type="module"'), "capture bridge precedes eager decision hydration");
});

test("worker leaves embed and 404 shells eager while trimming fallback route preloads", async () => {
  const shell = '<!doctype html><html><head><link rel="modulepreload" href="/assets/route-news.js"><link rel="stylesheet" href="/assets/index.css"><script type="module" src="/assets/index.js"></script></head><body><div id="root"></div></body></html>';
  const manifest = { version: "nexualpha-prerender-v1", routes: {
    "/embed/calculator|en": { pathname: "/embed/calculator", locale: "en", asset: "/prerender/en/embed-calculator.json" },
  } };
  const fallbackAssets = { async fetch(request) {
    const requestPath = new URL(request.url).pathname;
    if (requestPath === "/prerender-manifest.json") return Response.json(manifest);
    if (requestPath === "/prerender/en/embed-calculator.json") return Response.json({ html: "<main><h1>Embeddable Trading Fee Calculator</h1></main>" });
    if (requestPath === "/index.html") return new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } });
    return new Response("missing", { status: 404 });
  } };
  const cases = [
    ["/embed/calculator", 200, /id="nexualpha-prerender-state"/],
    ["/embed/calculator?scenario=fees&volume=12500.25", 200, /<div id="root"><\/div>/],
    ["/methodology", 200, /<div id="root"><\/div>/],
    ["/compare/binance-vs-missing", 404, /name="robots" content="noindex,nofollow"/],
  ];

  for (const [pathname, status, marker] of cases) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: fallbackAssets });
    const body = await response.text();
    assert.equal(response.status, status, pathname);
    assert.match(body, marker, pathname);
    if (pathname.startsWith("/embed/calculator") || status === 404) assert.match(body, /rel="modulepreload"/, pathname);
    else assert.doesNotMatch(body, /rel="modulepreload"/, pathname);
    assert.match(body, /<script type="module" src="\/assets\/index\.js"><\/script>/, pathname);
    if (pathname === "/embed/calculator") assert.match(body, /data-nexualpha-deferred-hydration/, pathname);
    else assert.doesNotMatch(body, /data-nexualpha-deferred-hydration/, pathname);
  }
});

test("worker falls back to the runtime news feed when article prerender fingerprint is absent or stale", async () => {
  const article = articles[0];
  const pathname = `/news/${article.slug}`;
  const changedFeed = JSON.stringify({
    articles: [{
      ...article,
      title: { ...article.title, en: "Runtime feed fallback headline" },
      content: { ...article.content, en: "Runtime feed fallback body." },
    }],
  });
  const shell = "<!doctype html><html><head><title>Shell</title></head><body><div id=\"root\"></div></body></html>";

  for (const [label, routePatch] of [
    ["missing fingerprint", {}],
    ["stale fingerprint", { newsFeedFingerprint: "stale-fingerprint" }],
  ]) {
    let feedRequests = 0;
    const manifest = {
      version: "nexualpha-prerender-v1",
      routes: {
        [`${pathname}|en`]: {
          pathname,
          locale: "en",
          html: "<main><h1>Stale prerender headline</h1></main>",
          newsArticles: [article],
          ...routePatch,
        },
      },
    };
    const fallbackAssets = {
      async fetch(request) {
        const requestPath = new URL(request.url).pathname;
        if (requestPath === "/prerender-manifest.json") return Response.json(manifest);
        if (requestPath === "/content/news-feed.json") {
          feedRequests += 1;
          return new Response(changedFeed, { headers: { "content-type": "application/json; charset=utf-8" } });
        }
        if (requestPath === "/index.html") {
          return new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } });
        }
        return new Response("missing", { status: 404 });
      },
    };

    const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, {
      headers: { accept: "text/html" },
    }), { ASSETS: fallbackAssets });
    const body = await response.text();

    assert.equal(response.status, 200, label);
    assert.ok(feedRequests > 0, label);
    assert.doesNotMatch(body, /Stale prerender headline/, label);
    const statePayload = body.match(/id="nexualpha-prerender-state">([^<]+)<\/script>/)?.[1];
    const state = statePayload ? JSON.parse(statePayload) : null;
    assert.ok(state, `${label}: expected runtime feed hydration state`);
    assert.equal(state.newsArticles?.[0]?.title?.en, "Runtime feed fallback headline", label);
    assert.match(body, /Runtime feed fallback headline/, label);
  }
});

test("neutral prerender payload remains available for query-driven venue, comparison and Brazil first-pass hydration",async()=>{
  const { localizedHref }=await import("../src/data/locale-routing.js");
  const cases=PRERENDER_LOCALES.flatMap(locale=>["/exchanges/bitget","/compare/bybit-vs-bitget"].map(pathname=>({pathname,locale,href:localizedHref(pathname,{locale,market:"BR",product:"spot",account_stage:"new_account",funding:"Pix"})})));
  cases.push(...["/br","/br/custos"].map(pathname=>({pathname,locale:"pt-BR",href:`${pathname}?market=BR&product=spot&account_stage=new_account&funding=Pix&platform=okx&amount=2500&spot_fee_bps=8&deposit_fee_pct=0.5&deposit_fixed_brl=2`})));
  for(const {pathname,locale,href} of cases){
    const readable=`<main><h1>Neutral ${locale} decision page</h1><a href="/methodology">Source notes</a></main>`;
    const manifest={version:"nexualpha-prerender-v1",routes:{[`${pathname}|${locale}`]:{pathname,locale,html:readable}}};
    const fixtureAssets={async fetch(request){const requested=new URL(request.url).pathname;if(requested==="/prerender-manifest.json")return Response.json(manifest);if(requested==="/content/brazil-metadata.json")return Response.json({version:1,pages:{[pathname]:{status:200,title:"Brazil decision",description:"Reviewed Brazil page",canonical:`https://nexualpha.com${pathname}`,locale:"pt-BR",robots:"index,follow",schemas:[]}}});if(requested==="/index.html")return new Response('<!doctype html><html><head><script type="module" src="/assets/index.js"></script></head><body><div id="root"></div></body></html>',{headers:{"content-type":"text/html"}});return new Response("missing",{status:404});}};
    const response=await worker.fetch(new Request(`https://nexualpha.com${href}`,{headers:{accept:"text/html"}}),{ASSETS:fixtureAssets});
    const body=await response.text();assert.equal(response.status,200,href);assert.ok(body.includes(readable),href);
    assert.doesNotMatch(body,/id="root" data-nexualpha-client-render="true"/,href);
    const state=body.match(/id="nexualpha-prerender-state">([^<]+)<\/script>/)?.[1];assert.ok(state,`${href}: query SSR must expose its actual neutral payload`);
    const parsed=JSON.parse(state);assert.equal(parsed.pathname,pathname,href);assert.equal(parsed.locale,locale,href);
  }
});
