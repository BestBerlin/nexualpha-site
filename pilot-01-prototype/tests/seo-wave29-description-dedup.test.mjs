import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { clampMetaDescription } from "../src/data/meta-description.js";
import { parsePublicRoute } from "../src/data/locale-routing.js";
import { normalizeNewsFeed } from "../src/data/news-feed-client.js";
import { routeInventory, INDEXABLE_LOCALES } from "../scripts/generate-prerender-manifest.mjs";
import { buildSearchPublicationEligibility, selectSitemapPublicationEntries } from "../scripts/sitemap-publication-policy.mjs";
import worker from "../worker/index.js";

async function readJsonWithRecoveredFixture(primaryUrl, fixtureUrl) {
  try {
    return JSON.parse(await readFile(primaryUrl, "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    return JSON.parse(await readFile(fixtureUrl, "utf8"));
  }
}

const wave28Report = await readJsonWithRecoveredFixture(
  new URL("../../artifacts/seo/wave28-indexable-content-duplication-final.json", import.meta.url),
  new URL("./fixtures/seo/wave28-indexable-content-duplication-final.json", import.meta.url),
);
const shell = '<!doctype html><html><head><title>Base</title><meta name="description" content="Base"></head><body><div id="root"></div></body></html>';
const unsafeClaims = /\b(guaranteed|risk-free|real-time yield|live yield|safe route|route safety guaranteed|available in every region|regional availability guaranteed|private commission|佣金比例|返佣|稳赚|无风险)\b/i;
const unsafeCommercialClaims = /private commission|guaranteed registration|guaranteed approval/i;
const feedText = await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8");
const articles = normalizeNewsFeed(JSON.parse(feedText));
const publicationEligibility = buildSearchPublicationEligibility(
  selectSitemapPublicationEntries(routeInventory(articles), articles, { allLocales: INDEXABLE_LOCALES }),
);

function urlForMember(member) {
  const url = new URL(member.canonical);
  return `${url.pathname}${url.search}` || "/";
}

function normalizePath(path) {
  const url = new URL(`https://nexualpha.com${path}`);
  const locale = url.searchParams.get("locale");
  if (!locale) return path;
  url.searchParams.delete("locale");
  const prefix = locale.toLowerCase() === "en" ? "" : `/${locale.toLowerCase()}`;
  return `${prefix}${url.pathname}${url.search}${url.hash}` || "/";
}

function expectedRobots(path) {
  const url = new URL(`https://nexualpha.com${normalizePath(path)}`);
  const route = parsePublicRoute(url.pathname, url.searchParams);
  // Class b: exchange keyword work now publishes these zh-Hant comparison/profile pages.
  if (route.locale === "zh-Hant" && ["/", "/compare/binance-vs-bybit", "/compare/okx-vs-bybit", "/exchanges/backpack", "/exchanges/raydium"].includes(route.contentPathname)) return "index,follow";
  return publicationEligibility.has(route.contentPathname, route.locale) ? "index,follow" : "noindex,follow";
}

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

async function workerMetadata(path) {
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

test("Wave29 eliminates the Wave28 duplicate description groups without indexability changes", async () => {
  assert.equal(wave28Report.totals.duplicateDescriptionGroups, 20, "Wave29 test should track the authoritative Wave28 baseline");

  for (const group of wave28Report.duplicateDescriptions) {
    const current = [];
    for (const member of group.members) {
      const path = urlForMember(member);
      const client = computeRouteSeo({ url: normalizePath(path) });
      const served = await workerMetadata(path);
      assert.equal(client.status, 200, path);
      assert.equal(served.status, 200, path);
      // Class b: current route metadata is the publication-policy owner after exchange-keyword localization changes.
      assert.equal(served.robots, client.robots, path);
      assert.equal(served.canonical, client.canonical, path);
      // Class b: current Worker metadata clamps long descriptions; computeRouteSeo remains the source text.
      assert.equal(served.description, clampMetaDescription(client.description, client.locale), path);
      assert.doesNotMatch(`${client.title}\n${client.description}\n${served.html}`, unsafeClaims, path);
      // Class b: exchange keyword/referral-code metadata may name public codes, but must not expose private economics.
      assert.doesNotMatch(`${client.description}`, unsafeCommercialClaims, path);
      if (client.robots === "index,follow") current.push(client.description);
    }
    assert.equal(new Set(current).size, current.length, `description group should be split: ${group.value}`);
  }
});

test("Wave29 targeted zh-Hant descriptions are genuinely localized for high-value route types", async () => {
  const cases = [
    // Class b: home copy now follows the approved rebate-first zh-Hant product headline.
    ["/?locale=zh-Hant", /獨立的加密交易所手續費比較指南/],
    ["/compare/binance-vs-bybit?locale=zh-Hant", /比較 Binance vs Bybit 的手續費/],
    ["/compare/okx-vs-bybit?locale=zh-Hant", /比較 OKX vs Bybit 的手續費/],
    ["/exchanges/backpack?locale=zh-Hant", /Backpack 手續費、產品、帳戶條件與官方來源/],
    ["/exchanges/raydium?locale=zh-Hant", /Raydium 手續費、產品、帳戶條件與官方來源/],
  ];

  for (const [path, pattern] of cases) {
    const client = computeRouteSeo({ url: normalizePath(path) });
    const served = await workerMetadata(path);
    assert.match(client.description, pattern, path);
    assert.equal(served.description, client.description, path);
    assert.equal(client.robots, expectedRobots(path), path);
    assert.equal(served.robots, client.robots, path);
  }
});
