import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { localizedPath, parsePublicRoute } from "../src/data/locale-routing.js";
import { normalizeNewsFeed } from "../src/data/news-feed-client.js";
import { routeInventory, INDEXABLE_LOCALES } from "../scripts/generate-prerender-manifest.mjs";
import { buildSearchPublicationEligibility, selectSitemapPublicationEntries } from "../scripts/sitemap-publication-policy.mjs";
import worker from "../worker/index.js";

const shell = '<!doctype html><html lang="en"><head><title>Base</title><meta name="description" content="Base"></head><body><div id="root"></div></body></html>';
const unsafeClaims = /\b(guaranteed|risk-free|real-time yield|live yield|safe route|route safety guaranteed|available in every region|regional availability guaranteed|private commission|佣金比例|返佣|稳赚|无风险)\b/i;
const invitationTokens = /nexu888|11350287|LUCKX|CANDY007|INS898|luckybitcoin/i;
const feedText = await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8");
const articles = normalizeNewsFeed(JSON.parse(feedText));
const publicationEligibility = buildSearchPublicationEligibility(
  selectSitemapPublicationEntries(routeInventory(articles), articles, { allLocales: INDEXABLE_LOCALES }),
);

function assets() {
  return {
    async fetch(request) {
      const path = new URL(request.url).pathname;
      if (path === "/index.html") return new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } });
      if (path === "/content/news-feed.json") return Response.json({ articles: [] });
      if (path === "/prerender-manifest.json") return new Response("missing", { status: 404 });
      return new Response("missing", { status: 404 });
    },
  };
}


function normalizePath(path) {
  const url = new URL(`https://nexualpha.com${path}`);
  const locale = url.searchParams.get("locale");
  if (!locale) return path;
  url.searchParams.delete("locale");
  return `${localizedPath(url.pathname, locale)}${url.search}${url.hash}` || "/";
}

function expectedRobots(path) {
  const url = new URL(`https://nexualpha.com${path}`);
  const route = parsePublicRoute(url.pathname, url.searchParams);
  // Class b: the 2026-10-10 search expansion intentionally publishes all-locale static utility pages.
  if (route.contentPathname === "/onchain") return "index,follow";
  return publicationEligibility.has(route.contentPathname, route.locale) ? "index,follow" : "noindex,follow";
}

async function workerSeo(path) {
  path = normalizePath(path);
  const response = await worker.fetch(
    new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: assets() },
  );
  const html = await response.text();
  return {
    status: response.status,
    title: html.match(/<title[^>]*>([^<]*)<\/title>/)?.[1] || "",
    description: html.match(/<meta name="description" content="([^"]*)"/)?.[1] || "",
    robots: html.match(/<meta name="robots" content="([^"]*)"/)?.[1] || "",
    canonical: html.match(/rel="canonical" href="([^"]+)"/)?.[1] || "",
    html,
  };
}

async function assertParity(path, titlePattern, descriptionPattern) {
  path = normalizePath(path);
  const client = computeRouteSeo({ url: path });
  const served = await workerSeo(path);
  assert.equal(served.status, client.status, `${path} status`);
  assert.equal(served.title, client.title, `${path} title parity`);
  assert.equal(served.description, client.description, `${path} description parity`);
  assert.equal(served.robots, client.robots, `${path} robots parity`);
  assert.equal(served.canonical, client.canonical, `${path} canonical parity`);
  assert.equal(client.robots, expectedRobots(path), `${path} follows publication eligibility`);
  assert.match(client.title, titlePattern, `${path} localized title`);
  assert.match(client.description, descriptionPattern, `${path} localized description`);
  assert.doesNotMatch(`${client.title}\n${client.description}\n${served.html}`, unsafeClaims, `${path} no unsafe claims`);
  assert.doesNotMatch(`${client.title}\n${client.description}`, invitationTokens, `${path} metadata has no invitation tokens`);
}

test("Wave28 static pages receive locale-specific metadata without changing Worker/client policy", async () => {
  const cases = [
    // Class b: onchain now owns the proof-of-reserves verification guide copy.
    ["/onchain?locale=es", /Prueba de reservas: cómo verificar un exchange cripto/, /prueba de reservas/],
    ["/onchain?locale=zh-Hant", /鏈上流動性與儲備證明核驗指南/, /儲備證明/],
    ["/partners?locale=de", /Partnerprogramm/, /Community|KOL/],
    ["/partners?locale=de", /Partnerprogramm/, /Community|KOL/],
    ["/methodology?locale=zh-Hant", /研究方法與編輯政策/, /商業合作關係/],
    ["/methodology?locale=de", /Forschungsmethodik und redaktionelle Richtlinie/, /kommerzielle Beziehungen/],
  ];
  for (const row of cases) await assertParity(...row);
});

test("Wave28 standard topic pages expose localized answer-engine metadata", async () => {
  const cases = [
    ["/topics/meme-coins?locale=es", /Comparación de plataformas meme coin/, /contratos de tokens/],
    ["/topics/compliant-exchanges?locale=fr", /Accès fiat/, /éligibilité régionale/],
    ["/topics/derivatives?locale=de", /Krypto-Perpetual/, /Liquidation/],
    // Class b: MEXC is now the KYC exchange contrast, not part of the no-KYC set.
    ["/topics/no-kyc?locale=it", /MEXC KYC vs Hyperliquid\/dYdX autocustodia/, /prelievi/],
    ["/ja/topics/no-kyc", /MEXC KYC 対 Hyperliquid\/dYdX 自己管理/, /地域制限/],
  ];
  for (const row of cases) await assertParity(...row);
});

test("localized Factbook URLs consolidate into the venue source hub", async () => {
  for (const [path, locale, slug] of [
    ["/zh-hant/factbook/binance", "zh-Hant", "binance"],
    ["/es/factbook/binance", "es", "binance"],
    ["/pt-br/factbook/okx", "pt-BR", "okx"],
    ["/ar/factbook/bybit", "ar", "bybit"],
  ]) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${path}`), { ASSETS: assets() });
    assert.equal(response.status, 301, path);
    assert.equal(response.headers.get("location"), `https://nexualpha.com${localizedPath(`/exchanges/${slug}`, locale)}#sources`, path);
    const seo = computeRouteSeo({ url: localizedPath(`/exchanges/${slug}`, locale) });
    assert.equal(seo.locale, locale, path);
    assert.ok(seo.schemas.some(schema => schema.citation?.length), `${path}: destination retains official source citations`);
  }
});

test("Wave28 targeted locale metadata reduces known duplicate title and description groups", () => {
  const groups = [
    ["/onchain", ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru"]],
    ["/embed/calculator", ["zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "tr"]],
    ["/partners", ["zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "tr"]],
    ["/methodology", ["zh-Hant", "es", "pt-BR", "fr", "de"]],
  ];

  for (const [pathname, locales] of groups) {
    const rows = locales.map((locale) => computeRouteSeo({ url: `${pathname}?locale=${locale}` }));
    assert.equal(new Set(rows.map((row) => row.title)).size, rows.length, `${pathname} titles should be locale-distinct`);
    assert.equal(new Set(rows.map((row) => row.description)).size, rows.length, `${pathname} descriptions should be locale-distinct`);
  }

  const topicRows = [
    "/topics/meme-coins?locale=es",
    "/topics/meme-coins?locale=pt-BR",
    "/topics/meme-coins?locale=fr",
    "/topics/compliant-exchanges?locale=de",
    "/topics/derivatives?locale=ja",
    "/topics/no-kyc?locale=it",
  ].map((url) => computeRouteSeo({ url }));
  assert.equal(new Set(topicRows.map((row) => row.title)).size, topicRows.length, "topic titles should be distinct in targeted locales");
  assert.equal(new Set(topicRows.map((row) => row.description)).size, topicRows.length, "topic descriptions should be distinct in targeted locales");

  const factbookRows = [
    "/factbook/binance?locale=en",
    "/factbook/binance?locale=zh-Hans",
    "/factbook/binance?locale=zh-Hant",
    "/factbook/binance?locale=es",
    "/factbook/binance?locale=pt-BR",
    "/factbook/binance?locale=fr",
    "/factbook/binance?locale=de",
    "/factbook/binance?locale=ja",
    "/factbook/binance?locale=ko",
    "/factbook/binance?locale=ar",
    "/factbook/binance?locale=tr",
    "/factbook/binance?locale=ru",
  ].map((url) => computeRouteSeo({ url }));
  assert.equal(new Set(factbookRows.map((row) => row.description)).size, factbookRows.length, "factbook descriptions should be locale-distinct");
});

test("Wave28 Traditional Chinese topic pages expose their own direct-answer body", async () => {
  const source = await readFile(new URL("../src/components/v3/TopicGuidePage.jsx", import.meta.url), "utf8");
  for (const slug of ["meme-coins", "compliant-exchanges", "no-kyc"]) {
    assert.match(source, new RegExp(`"${slug}"\\s*:\\s*\\{`));
  }
  assert.match(source, /TRADITIONAL_CHINESE_DIRECT_ANSWERS/);
  assert.match(source, /繁體中文直接答案/);
  assert.match(source, /locale === "zh-Hant"/);
});
