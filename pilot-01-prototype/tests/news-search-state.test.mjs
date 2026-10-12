// T10 indexation recovery (2026-10-12) + "Updated" byline (quick fix A).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { renderArticleSitemap, renderLiveNewsSitemap, routeMetadata } from "../worker/index.js";
import { applyNewsSearchState, applyNewsSearchStateToFeed, newsStrengthRank } from "../src/data/news-search-state.js";
import { NEWS_CANONICAL_TARGETS, NEWS_STRONG_SLUGS, NEWS_THIN_NOINDEX_SLUGS } from "../src/data/news-search-state.generated.js";
import { renderNewsSearchStateModule, latestListName } from "../scripts/generate-news-search-state.mjs";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { normalizeNewsFeed } from "../src/data/news-feed-client.js";
import { NEWS_HUB_TOOL_KEY, isRelatedArticlesToolKey, toolArticles, toolKeyForPath, toolKeyForRoute } from "../src/data/topic-clusters.js";
import { createSsrHarness } from "./helpers/ssr-hydration-harness.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const THIN = NEWS_THIN_NOINDEX_SLUGS[0];
const [WEAK, STRONG] = Object.entries(NEWS_CANONICAL_TARGETS)[0];
const TOP = NEWS_STRONG_SLUGS[0];
const now = Date.now();

const row = (slug, extra = {}) => ({
  slug,
  status: "PUBLISHED",
  category: "research",
  publishedAt: new Date(now - 6 * 3600_000).toISOString(),
  updatedAt: new Date(now - 3 * 3600_000).toISOString(),
  author: "NexuAlpha Research Desk",
  title: { en: `Title ${slug}`, "zh-Hans": `标题 ${slug}` },
  summary: { en: `Summary of ${slug} with enough words to be a summary.`, "zh-Hans": `摘要 ${slug}` },
  content: { en: `## The short answer\n\nBody of ${slug}.`, "zh-Hans": `## 简短回答\n\n正文 ${slug}。` },
  sources: [{ id: "s1", url: "https://example.com/source", publisher: "Example", title: "Example source" }],
  availableLocales: ["en", "zh-Hans"],
  relatedVenues: ["okx"],
  seo: { noindex: false },
  ...extra,
});
const feed = { version: 1, articles: [row(THIN), row(WEAK), row(STRONG), row(TOP), row("plain-fresh-article-okx")] };
const feedText = JSON.stringify(feed);
const env = { ASSETS: { fetch: async (request) => new URL(request.url).pathname === "/content/news-feed.json"
  ? new Response(feedText, { headers: { "content-type": "application/json" } })
  : new Response("missing", { status: 404 }) } };

test("the generated module matches the newest ops/newsroom list (run scripts/generate-news-search-state.mjs)", () => {
  const listDir = path.join(root, "..", "ops", "newsroom");
  const name = latestListName(listDir);
  const list = JSON.parse(readFileSync(path.join(listDir, name), "utf8"));
  assert.equal(readFileSync(path.join(root, "src/data/news-search-state.generated.js"), "utf8"), renderNewsSearchStateModule(list, name));
  assert.ok(list.noindex.length > 200, "the T10 list flags the template pages");
  for (const item of list.canonical) assert.ok(!list.noindex.some((thin) => thin.slug === item.slug || thin.slug === item.canonicalSlug), "canonical pairs are not thin");
  for (const slug of list.strong.map((item) => item.slug)) assert.ok(!list.noindex.some((thin) => thin.slug === slug), "strong pages are never noindexed");
});

test("applyNewsSearchState: thin -> noindex, weaker duplicate -> canonicalized, others untouched", () => {
  const thin = applyNewsSearchState(row(THIN));
  assert.equal(thin.searchState, "noindex-thin");
  assert.equal(thin.seo.noindex, true);
  const weak = applyNewsSearchState(row(WEAK));
  assert.equal(weak.searchState, "canonicalized");
  assert.equal(weak.canonicalSlug, STRONG);
  const plain = row("plain-fresh-article-okx");
  assert.equal(applyNewsSearchState(plain), plain);
  const flagged = applyNewsSearchState(row("publisher-flagged", { searchState: "noindex-thin" }));
  assert.equal(flagged.seo.noindex, true, "a feed-level flag from the publisher is honoured");
  assert.equal(applyNewsSearchStateToFeed(feed).articles.filter((item) => item.searchState).length, 2);
  assert.equal(newsStrengthRank(TOP), 0);
  assert.equal(newsStrengthRank(THIN), Number.POSITIVE_INFINITY);
});

test("thin article: 200, noindex,follow, no hreflang, out of every sitemap", async () => {
  const meta = await routeMetadata(new URL(`https://nexualpha.com/news/${THIN}`), env);
  assert.equal(meta.status, 200);
  assert.equal(meta.robots, "noindex,follow");
  assert.deepEqual(meta.alternates, []);
  assert.equal(meta.canonical, `https://nexualpha.com/news/${THIN}`);
  const live = (await (await import("../worker/index.js")).default.fetch(new Request("https://nexualpha.com/news-sitemap.xml"), env));
  const xml = await live.text();
  assert.doesNotMatch(xml, new RegExp(THIN));
  assert.match(xml, /plain-fresh-article-okx/, "a normal fresh article stays in the news sitemap");
  const stated = applyNewsSearchStateToFeed(feed).articles;
  assert.doesNotMatch(renderArticleSitemap(stated, "en"), new RegExp(`/news/${THIN}<`));
  assert.doesNotMatch(renderLiveNewsSitemap(stated, now), new RegExp(`/news/${WEAK}<`));
  const sitemapResponse = await (await import("../worker/index.js")).default.fetch(new Request("https://nexualpha.com/sitemap-articles-en.xml"), env);
  const articleXml = await sitemapResponse.text();
  assert.doesNotMatch(articleXml, new RegExp(`/news/${THIN}<`));
  assert.doesNotMatch(articleXml, new RegExp(`/news/${WEAK}<`));
  assert.match(articleXml, new RegExp(`/news/${TOP}<`), "strong article stays in the article sitemap");
});

test("weaker duplicate: index,follow with rel=canonical on the stronger article (worker head and client head agree)", async () => {
  const meta = await routeMetadata(new URL(`https://nexualpha.com/news/${WEAK}`), env);
  assert.equal(meta.status, 200);
  assert.equal(meta.robots, "index,follow");
  assert.equal(meta.canonical, `https://nexualpha.com/news/${STRONG}`);
  assert.deepEqual(meta.alternates, []);
  const zh = await routeMetadata(new URL(`https://nexualpha.com/zh-hans/news/${WEAK}`), env);
  assert.equal(zh.canonical, `https://nexualpha.com/zh-hans/news/${STRONG}`, "same-language edition of the stronger article");
  const articles = normalizeNewsFeed(applyNewsSearchStateToFeed(feed));
  const weak = articles.find((item) => item.slug === WEAK);
  const client = computeRouteSeo({ url: `/news/${WEAK}`, locale: "en", article: weak, newsArticles: articles, route: { name: "newsDetail", slug: WEAK } });
  assert.equal(client.robots, "index,follow");
  assert.equal(client.canonical, `https://nexualpha.com/news/${STRONG}`);
  const strong = await routeMetadata(new URL(`https://nexualpha.com/news/${TOP}`), env);
  assert.equal(strong.robots, "index,follow", "strong article stays indexable");
  assert.equal(strong.canonical, `https://nexualpha.com/news/${TOP}`);
});

test("article schema names no reviewer without a human review record", async () => {
  const meta = await routeMetadata(new URL(`https://nexualpha.com/news/${TOP}`), env);
  const news = (Array.isArray(meta.schema) ? meta.schema : [meta.schema]).find((node) => node?.["@type"] === "NewsArticle");
  assert.ok(news);
  assert.equal(news.reviewedBy, undefined);
});

test("related-article keys: /news hub, exchange profiles and topic hubs, strongest first", () => {
  assert.equal(toolKeyForPath("/news"), NEWS_HUB_TOOL_KEY);
  assert.equal(toolKeyForPath("/exchanges/okx"), "venue:okx");
  assert.equal(toolKeyForPath("/topics/derivatives"), "topic:derivatives");
  assert.equal(toolKeyForRoute({ name: "newsList", category: null, page: 1 }), NEWS_HUB_TOOL_KEY);
  assert.equal(toolKeyForRoute({ name: "newsList", category: "guide", page: 1 }), null);
  assert.equal(toolKeyForRoute({ name: "venue", slug: "okx" }), "venue:okx");
  assert.ok(isRelatedArticlesToolKey("venue:okx") && isRelatedArticlesToolKey("news-hub") && isRelatedArticlesToolKey("topic:derivatives"));
  assert.ok(!isRelatedArticlesToolKey("topic:nope") && !isRelatedArticlesToolKey("../etc"));
  const articles = applyNewsSearchStateToFeed(feed).articles;
  const hub = toolArticles(NEWS_HUB_TOOL_KEY, articles, { rank: newsStrengthRank });
  assert.equal(hub[0].slug, TOP, "hub lists the strongest article");
  assert.ok(hub.every((item) => Number.isFinite(newsStrengthRank(item.slug))), "hub lists strong articles only");
  const venue = toolArticles("venue:okx", articles, { rank: newsStrengthRank });
  assert.equal(venue[0].slug, TOP, "exchange page puts the strongest article first");
  assert.ok(venue.findIndex((item) => item.slug === THIN) > venue.findIndex((item) => item.slug === "plain-fresh-article-okx"), "thin pages come after indexable ones");
});

let harness;
test("byline says Updated <date> unless a human review record exists", async (t) => {
  harness = await createSsrHarness();
  t.after(() => harness.close());
  const plain = normalizeNewsFeed({ articles: [row("byline-fixture")] })[0];
  const html = await harness.render("https://nexualpha.com/news/byline-fixture", { newsArticles: [plain] });
  assert.match(html, /class="news-detail__byline-updated">Updated(?:<!-- -->)? <time/);
  assert.doesNotMatch(html, /byline-reviewed|>Reviewed(?:<!-- -->)? </);
  const zh = await harness.render("https://nexualpha.com/zh-hans/news/byline-fixture", { newsArticles: [plain] });
  assert.match(zh, /更新于(?:<!-- -->)? <time/);
  const reviewed = normalizeNewsFeed({ articles: [row("byline-fixture", { humanReviewedBy: "Jane Editor", humanReviewedAt: "2026-10-12T08:00:00Z" })] })[0];
  const reviewedHtml = await harness.render("https://nexualpha.com/news/byline-fixture", { newsArticles: [reviewed] });
  assert.match(reviewedHtml, /class="news-detail__byline-reviewed">Reviewed(?:<!-- -->)? <time dateTime="2026-10-12"/);
});
