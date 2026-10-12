import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import worker from "../worker/index.js";

const originalNow = Date.now;
Date.now = () => Date.parse("2026-10-12T12:00:00Z");
after(() => { Date.now = originalNow; });

const feedText = await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8");
const feed = JSON.parse(feedText);
const shell = "<!doctype html><html lang=\"en\"><head><title>old</title></head><body><div id=\"root\"></div></body></html>";
const okxSlug = "okx-api-key-ip-allowlist-expiry-readiness-checklist";
const neutralSlug = "cftc-sec-tokenized-collateral-vs-tokenized-securities-boundary-map";
const misleadingSlug = "okx-misleading-title-without-promotion-metadata";

assert.ok(feed.articles.some((article) => article.slug === okxSlug), "OKX fixture article exists");
assert.ok(feed.articles.some((article) => article.slug === neutralSlug), "neutral fixture article exists");

const feedWithOkxPromotionMetadata = {
  ...feed,
  articles: feed.articles.map((article) => article.slug === okxSlug ? { ...article, topicTags: ["okx"] } : article),
};

function assetsFor(feedPayload = feed) {
  const text = JSON.stringify(feedPayload);
  const hash = createHash("sha256").update(text).digest("hex");
  return { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/content/news-feed.json") return new Response(text, { headers: { "content-type": "application/json" } });
  if (pathname === "/content/news-feed.sha256.txt") return new Response(hash);
  if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
  if (pathname === "/index.html") return new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } });
  return new Response("missing", { status: 404 });
} };
}

async function html(pathname, feedPayload = feed) {
  const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: assetsFor(feedPayload) });
  const body = await response.text();
  assert.equal(response.status, 200, pathname);
  assert.equal(response.headers.get("x-nexualpha-news-render"), "fallback", pathname);
  return body;
}

function slot(htmlText, variant) {
  const match = htmlText.match(new RegExp(`<aside class="sponsored-slot sponsored-slot--${variant}"[\\s\\S]*?</aside>`));
  assert.ok(match, `${variant} slot exists`);
  return match[0];
}

test("fallback SSR renders commercial slots for matching English news articles", async () => {
  const body = await html(`/news/${okxSlug}`, feedWithOkxPromotionMetadata);
  const inline = slot(body, "inline");
  const end = slot(body, "end");
  const sidebar = slot(body, "sidebar");
  assert.match(body, /<\/section>\s+<div class="news-detail__rail"><div class="news-detail__rail-sticky"><aside class="sponsored-slot sponsored-slot--sidebar"/);
  assert.match(inline, /Sponsored/);
  assert.match(end, /Sponsored/);
  assert.match(sidebar, /Sponsored/);
  for (const snippet of [inline, end, sidebar]) {
    assert.match(snippet, /href="\/go\/okx\?src=news-sponsored&amp;locale=en"/);
    assert.match(snippet, /target="_blank"/);
    assert.match(snippet, /rel="sponsored noopener"/);
    assert.doesNotMatch(snippet, /not investment advice|commission|affiliate/i);
  }
  assert.ok(body.indexOf('data-sponsored-slot="inline"') > body.indexOf("<p"), "inline slot is inserted after body content starts");
  assert.ok(body.indexOf('data-sponsored-slot="inline"') < body.indexOf("<h2>Sources</h2>"), "inline slot appears before sources");
});

test("fallback SSR localizes matching zh-Hans commercial slots", async () => {
  const body = await html(`/zh-hans/news/${okxSlug}`, feedWithOkxPromotionMetadata);
  const inline = slot(body, "inline");
  assert.match(inline, /推广/);
  assert.match(inline, /href="\/go\/okx\?src=news-sponsored&amp;locale=zh-Hans"/);
  assert.match(inline, /rel="sponsored noopener"/);
});

test("fallback SSR uses neutral site tools when an article has no commercial match", async () => {
  const body = await html(`/zh-hans/news/${neutralSlug}`);
  assert.doesNotMatch(body, /data-sponsored-slot="inline"/);
  const end = slot(body, "end");
  const sidebar = slot(body, "sidebar");
  for (const snippet of [end, sidebar]) {
    assert.match(snippet, /站内工具/);
    assert.match(snippet, /href="https:\/\/nexualpha\.com\/zh-hans\/compare"/);
    assert.doesNotMatch(snippet, /rel="sponsored noopener"/);
    assert.doesNotMatch(snippet, /target="_blank"/);
    assert.doesNotMatch(snippet, /\/go\//);
  }
});

test("fallback SSR does not infer a commercial match from misleading slug or title", async () => {
  const source = feed.articles.find((article) => article.slug === neutralSlug);
  const misleadingArticle = {
    ...source,
    slug: misleadingSlug,
    title: { en: "OKX registration and Binance campaign comparison", "zh-Hans": "OKX 注册与 Binance 活动对比" },
    summary: { en: "Mentions partner names in text without promotion metadata.", "zh-Hans": "正文提到合作方名称，但没有推广元数据。" },
    relatedVenues: [],
    topicTags: [],
    tags: [],
    cta: undefined,
  };
  const customFeed = { ...feed, articles: [misleadingArticle, ...feed.articles] };
  const body = await html(`/news/${misleadingSlug}`, customFeed);
  assert.doesNotMatch(body, /data-sponsored-slot="inline"/);
  const end = slot(body, "end");
  assert.match(end, /Site tool/);
  assert.doesNotMatch(end, /\/go\/(?:okx|binance)/);
  assert.doesNotMatch(end, /rel="sponsored noopener"/);
});

test("packaged Worker includes the complete promotion dependency graph", async () => {
  const packaged = await import('../dist/server/index.js');
  assert.equal(typeof packaged.default.fetch, 'function');
});
