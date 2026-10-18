import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeRouteSeo } from "../src/data/seo-injection.js";
import { normalizeNewsFeed } from "../src/data/news-feed-client.js";
import routeInventory from "../dist/client/route-inventory.json" with { type: "json" };
import productionFeed from "../public/content/news-feed.json" with { type: "json" };
import sitesWorker from "../worker/index.js";

const wave43Slugs = [
  "binance-vs-okx-spot-pair-removal-order-cancellation-migration-controls",
  "institutional-stablecoin-cash-management-governance-controls-radar",
  "okx-pendleusd-x-perp-launch-contract-risk-checklist",
  "sec-cftc-crypto-asset-interpretation-token-taxonomy-user-boundary",
  "tokenized-collateral-acceptance-reuse-rehypothecation-risk-framework",
];

const shell = '<!doctype html><html lang="en"><head><title>Base</title><meta name="description" content="Base"></head><body><div id="root"></div></body></html>';
const indexableRouteByPath = new Map(routeInventory.routes
  .filter((route) => route.index === true)
  .map((route) => [route.pathname, route]));

function assets({ feed = productionFeed } = {}) {
  return {
    async fetch(request) {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/index.html" || pathname === "/") {
        return new Response(shell, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
      }
      if (pathname === "/content/news-feed.json") {
        return new Response(JSON.stringify(feed), { status: 200, headers: { "content-type": "application/json" } });
      }
      if (pathname === "/content/news-feed.sha256.txt") {
        try {
          const text = await readFile(new URL("../dist/client/content/news-feed.sha256.txt", import.meta.url), "utf8");
          return new Response(text, { status: 200, headers: { "content-type": "text/plain" } });
        } catch {
          return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain" } });
        }
      }
      if (pathname === "/prerender-manifest.json" || pathname.startsWith("/prerender/")) {
        try {
          const text = await readFile(new URL(`../dist/client${pathname}`, import.meta.url), "utf8");
          return new Response(text, { status: 200, headers: { "content-type": "application/json" } });
        } catch {
          return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain" } });
        }
      }
      return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain" } });
    },
  };
}

function renderedInternalAnchors(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)]
    .map((match) => match[1].replace(/&amp;/g, "&"))
    .filter((href) => href.startsWith("/") || href.startsWith("https://nexualpha.com/"));
}

function assertIndexableInventoryTarget(target, context) {
  const path = target.startsWith("https://nexualpha.com/")
    ? new URL(target).pathname
    : target;
  assert.ok(indexableRouteByPath.has(path), `${context} target must exist and be indexable: ${target}`);
}

function routeGraph(html) {
  const json = html.match(/<script id="nexualpha-route-schema"[^>]*>(.*?)<\/script>/)?.[1];
  assert.ok(json, "route schema script exists");
  const parsed = JSON.parse(json);
  return parsed["@graph"] || (Array.isArray(parsed) ? parsed : [parsed]);
}

test("Wave44 rendered sitemap anchors omit unknown context and default English locale variants", async () => {
  for (const pathname of ["/", "/exchanges", "/activities", "/news"]) {
    const response = await sitesWorker.fetch(
      new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }),
      { ASSETS: assets() },
    );
    const html = await response.text();
    const anchors = renderedInternalAnchors(html);

    assert.equal(response.status, 200, pathname);
    assert.ok(anchors.length > 0, `${pathname} renders internal anchors`);
    assert.doesNotMatch(anchors.join("\n"), /[?&](?:market|product)=unknown(?:[&#]|$)/, pathname);
    assert.doesNotMatch(anchors.join("\n"), /[?&]locale=en(?:[&#]|$)/, pathname);
  }
});

test("Wave44 GMX profile emits source-bound FAQ and related-link schema", async () => {
  const client = computeRouteSeo({ url: "/exchanges/gmx", locale: "en" });
  const clientPage = client.schemas.find((schema) => schema["@type"] === "WebPage");
  const clientFaq = client.schemas.find((schema) => schema["@type"] === "FAQPage");

  assert.equal(client.title, "GMX v2 Fees: Pools, Price Impact, Funding and Liquidation — NexuAlpha");
  assert.ok(clientPage.relatedLink.some((url) => url === "https://nexualpha.com/factbook/gmx"));
  assert.ok(clientPage.relatedLink.some((url) => url === "https://nexualpha.com/compare/hyperliquid-vs-dydx"));
  assert.ok(clientPage.citation.includes("https://docs.gmx.io/docs/intro/"));
  assert.ok(clientPage.citation.includes("https://docs.gmx.io/docs/trading/order-types/"));
  assert.ok(clientFaq);
  assert.equal(clientFaq.mainEntity.length, 4);
  assert.match(JSON.stringify(clientFaq.mainEntity), /When is GMX a sensible next page to open/);
  assert.match(JSON.stringify(clientFaq.mainEntity), /pool selection, collateral, oracle-based execution/);
  assert.ok(clientFaq.mainEntity.every((entry) => entry.acceptedAnswer.citation.length >= 1));
});

test("Worker SSR emits GMX FAQ and Wave43 article relatedLink schema", async () => {
  const gmxResponse = await sitesWorker.fetch(
    new Request("https://nexualpha.com/exchanges/gmx", { headers: { accept: "text/html" } }),
    { ASSETS: assets() },
  );
  const gmxHtml = await gmxResponse.text();
  const gmxGraph = routeGraph(gmxHtml);
  const gmxPage = gmxGraph.find((schema) => schema["@type"] === "WebPage");
  const gmxFaq = gmxGraph.find((schema) => schema["@type"] === "FAQPage");

  assert.equal(gmxResponse.status, 200);
  assert.ok(gmxPage.relatedLink.includes("https://nexualpha.com/factbook/gmx"));
  assert.ok(gmxPage.relatedLink.includes("https://nexualpha.com/compare/hyperliquid-vs-dydx"));
  assert.ok(gmxPage.citation.includes("https://docs.gmx.io/docs/intro/"));
  assert.ok(gmxFaq);
  assert.equal(gmxFaq.mainEntity.length, 4);

  const slug = wave43Slugs[0];
  const articleResponse = await sitesWorker.fetch(
    new Request(`https://nexualpha.com/news/${slug}`, { headers: { accept: "text/html" } }),
    { ASSETS: assets() },
  );
  const articleHtml = await articleResponse.text();
  const articleGraph = routeGraph(articleHtml);
  const articleSchema = articleGraph.find((schema) => schema["@type"] === "NewsArticle");

  assert.equal(articleResponse.status, 200);
  const articleAnchors = renderedInternalAnchors(articleHtml);
  assert.ok(articleAnchors.includes("/compare/binance-vs-okx"));
  assert.ok(articleAnchors.includes("/news/okx-usd-to-usdc-spot-pair-migration"));
  // SEO w43: relatedLink is a WebPage property, so it moved from the NewsArticle to its mainEntityOfPage WebPage.
  assert.equal(articleSchema.relatedLink, undefined);
  const articlePage = articleSchema.mainEntityOfPage;
  assert.equal(articlePage["@type"], "WebPage");
  assert.ok(articlePage.relatedLink.includes("https://nexualpha.com/compare/binance-vs-okx"));
  assert.ok(articlePage.relatedLink.includes("https://nexualpha.com/news/okx-usd-to-usdc-spot-pair-migration"));
  assert.doesNotMatch(articlePage.relatedLink.join("\n"), /\/ref\/|register|commission/i);
});

test("Wave43 articles expose internal related research in feed, schema and detail page", async () => {
  const articles = normalizeNewsFeed(productionFeed);
  const bySlug = new Map(articles.map((article) => [article.slug, article]));
  const detailSource = await readFile(new URL("../src/components/v3/news/NewsDetailPage.jsx", import.meta.url), "utf8");

  assert.match(detailSource, /function RelatedResearch/);
  assert.match(detailSource, /news-detail-related-research/);
  assert.ok(
    detailSource.indexOf("<RelatedResearch") > detailSource.indexOf("news-detail__content"),
    "Related research renders after the article body",
  );
  assert.ok(
    detailSource.indexOf("<RelatedResearch") < detailSource.lastIndexOf("article.relatedVenues && article.relatedVenues.length > 0"),
    "Related research renders before the venue-only next decision box",
  );

  for (const slug of wave43Slugs) {
    const article = bySlug.get(slug);
    assert.ok(article, `${slug} exists`);
    assert.equal(article.updatedAt, "2026-09-15T11:39:24Z", slug);
    assert.ok(article.seo.internalLinkTargets.length >= 5, `${slug} related links`);
    assert.ok(article.seo.internalLinkTargets.every((target) => target.startsWith("/")), `${slug} internal-only targets`);
    assert.doesNotMatch(article.seo.internalLinkTargets.join("\n"), /\/venues\/|register|ref=|commission/i, `${slug} no commercial leakage`);
    for (const target of article.seo.internalLinkTargets) assertIndexableInventoryTarget(target, slug);

    const seo = computeRouteSeo({ url: `/news/${slug}`, article, locale: "en", force: true });
    const schema = seo.schemas.find((row) => row["@type"] === "NewsArticle");
    // SEO w43: the related links ride on the article's mainEntityOfPage WebPage, not on the NewsArticle.
    assert.equal(schema.relatedLink, undefined, `${slug} NewsArticle carries no relatedLink`);
    assert.ok(schema.mainEntityOfPage.relatedLink.length >= article.seo.internalLinkTargets.length, `${slug} WebPage relatedLink`);
    assert.ok(schema.mainEntityOfPage.relatedLink.every((url) => url.startsWith("https://nexualpha.com/")), `${slug} canonical relatedLink URLs`);

    assert.match(detailSource, /RelatedResearch links=\{relatedLinks\}/, `${slug} renders related module from computed links`);
  }
});

test("production article internal links do not expose retired guide routes", () => {
  const allTargets = productionFeed.articles.flatMap((article) => article.seo?.internalLinkTargets || []);
  assert.doesNotMatch(allTargets.join("\n"), /^\/guides\//m);
});
