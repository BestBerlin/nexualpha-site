// News listing SSR (2026-10-11): /news, /ru/news, /news/page/2 and /news/category/<key> are rendered at request time by
// the same NewsListPage the browser hydrates. Before this, the worker served a hand-written template (old H1, 3 links)
// that the client replaced on mount: CLS 0.55-0.94 on every listing page and stale copy for crawlers.
import assert from "node:assert/strict";
import test from "node:test";
import worker from "../worker/index.js";
import { newsCategoryCopy, NEWS_PAGE_SIZE } from "../src/data/news-library.js";
import { newsListHeroCopy, NEWS_LIST_COPY_LOCALES } from "../src/data/news-list-copy.js";
import { createSsrHarness, SHELL_HTML, prerenderState, rootInnerHtml, h1Texts, hydrateInJsdom, hydrationErrors } from "./helpers/ssr-hydration-harness.mjs";

const categories = ["guide", "comparison", "exchange-update", "regulation", "rwa", "research"];
const venues = ["binance", "okx", "bybit", "bitget", "kraken", "coinbase"];
// 40 published articles (newest first); every third one also has a native Russian edition.
const articles = Array.from({ length: 40 }, (_, index) => {
  const n = String(index).padStart(2, "0");
  const category = categories[index % categories.length];
  const ru = index % 3 === 0;
  return {
    slug: `fixture-article-${n}`,
    status: "PUBLISHED",
    category,
    categoryName: { en: newsCategoryCopy(category, "en").label, "zh-Hans": newsCategoryCopy(category, "zh-Hans").label },
    publishedAt: new Date(Date.UTC(2026, 9, 10, 12) - index * 3_600_000).toISOString(),
    readTime: "5 min",
    author: "NexuAlpha Research Desk",
    title: { en: `Fixture article ${n} about ${category}`, "zh-Hans": `测试文章 ${n}`, ...(ru ? { ru: `Тестовая статья ${n}` } : {}) },
    summary: { en: `Summary ${n} for ${category}.`, "zh-Hans": `摘要 ${n}`, ...(ru ? { ru: `Краткое содержание ${n}` } : {}) },
    content: { en: `Body ${n} `.repeat(30), "zh-Hans": `正文 ${n}`, ...(ru ? { ru: `Текст ${n}` } : {}) },
    sources: [{ id: "s", url: "https://example.com/source", publisher: "Example" }],
    relatedVenues: [venues[index % venues.length], venues[(index + 1) % venues.length]],
    seo: { noindex: false },
    availableLocales: ["en", "zh-Hans", ...(ru ? ["ru"] : [])],
  };
});
const feedText = JSON.stringify({ articles });

const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/content/news-feed.json") return new Response(feedText, { headers: { "content-type": "application/json" } });
  if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  return new Response("missing", { status: 404 });
} };

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

const fetchPage = (pathname, env) => worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), env);
const newsLinks = (html) => new Set([...html.matchAll(/href="(?:https:\/\/nexualpha\.com)?(?:\/[a-z]{2}(?:-[A-Za-z]+)?)?\/news\/([a-z0-9-]+)"/g)].map((match) => match[1]));

const cases = [
  { path: "/news", locale: "en", page: 1, category: null },
  { path: "/ru/news", locale: "ru", page: 1, category: null },
  { path: "/news/page/2", locale: "en", page: 2, category: null },
  { path: "/news/category/guide", locale: "en", page: 1, category: "guide" },
];

test("listing routes are server-rendered by NewsListPage: one H1 equal to the client heading, 24 cards, search and chips", async () => {
  const calls = [];
  const env = { ASSETS: assets, NEWS_SSR_RENDER: async (href, options) => { calls.push({ href, options }); return harness.render(href, options); } };
  for (const { path, locale, page, category } of cases) {
    calls.length = 0;
    const response = await fetchPage(path, env);
    const html = await response.text();
    assert.equal(response.status, 200, path);
    assert.equal(calls.length, 1, `${path}: rendered once at request time`);
    assert.equal(calls[0].href, `https://nexualpha.com${category ? `/news/category/${category}` : page > 1 ? `/news/page/${page}` : "/news"}?locale=${locale}`, `${path}: renders the hydration bootstrap URL`);
    assert.doesNotMatch(html, /data-nexualpha-client-render="true"/, `${path}: hydrates instead of re-rendering`);
    assert.doesNotMatch(html, /data-nexualpha-ssr-fallback/, `${path}: not the hand-written fallback`);
    const headings = h1Texts(html);
    assert.equal(headings.length, 1, `${path}: exactly one H1 (${headings.join(" | ")})`);
    assert.equal(headings[0], category ? newsCategoryCopy(category, locale).label : newsListHeroCopy(locale).title, `${path}: H1 is the client heading`);
    assert.match(html, /<input[^>]*id="news-index-query"[^>]*type="search"/, `${path}: search box`);
    assert.match(html, /<nav class="news-tabs news-category-nav"/, `${path}: category chips`);
    assert.match(html, /data-telegram-alerts-strip="news-list-telegram-alerts"/, `${path}: alerts strip`);
    const links = newsLinks(html);
    const expectedRows = category ? articles.filter((article) => article.category === category).length : Math.min(NEWS_PAGE_SIZE, articles.length - (page - 1) * NEWS_PAGE_SIZE);
    if (page === 1 && !category) assert.ok(links.size >= 20, `${path}: ${links.size} article links on page 1`);
    assert.equal(links.size, expectedRows, `${path}: every row of the page is linked`);
    assert.match(html, new RegExp(`data-news-page="${page}"`), `${path}: page attribute`);
    assert.match(html, new RegExp(`data-news-category="${category || "all"}"`), `${path}: category attribute`);
    const state = prerenderState(html);
    assert.ok(state, `${path}: hydration state`);
    assert.equal(state.pathname, category ? `/news/category/${category}` : page > 1 ? `/news/page/${page}` : "/news");
    assert.equal(state.locale, locale);
    assert.equal(state.newsArticles.length, expectedRows, `${path}: summary rows for this page only`);
    assert.deepEqual(state.newsListing, { category, page, total: category ? expectedRows : articles.length, totalPages: category ? 1 : Math.ceil(articles.length / NEWS_PAGE_SIZE), libraryTotal: articles.length, counts: state.newsListing.counts });
    for (const row of state.newsArticles) {
      assert.equal(row.content, undefined, `${path}: list hydration is summary-only`);
      assert.equal(row.sources, undefined, `${path}: list hydration carries no sources`);
      assert.equal(row.seo, undefined, `${path}: list hydration carries no seo block`);
    }
  }
});

test("the hydration payload reproduces the SSR body byte for byte (renderToString round trip)", async () => {
  const env = { ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) };
  for (const { path, locale, page, category } of cases) {
    const html = await (await fetchPage(path, env)).text();
    const state = prerenderState(html);
    const bootstrapUrl = `https://nexualpha.com${state.pathname}?locale=${locale}`;
    const replay = await harness.render(bootstrapUrl, { newsArticles: state.newsArticles, newsListing: state.newsListing });
    assert.equal(replay, rootInnerHtml(html), `${path}: client props render the same markup (page ${page}, category ${category})`);
  }
});

test("hydrateRoot in jsdom reports no hydration mismatch for /news, /ru/news, /news/page/2 and /news/category/guide", async () => {
  const env = { ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) };
  for (const { path } of cases) {
    const pageUrl = `https://nexualpha.com${path}`;
    const html = await (await fetchPage(path, env)).text();
    const { errors, text } = await hydrateInJsdom(harness.vite, html, pageUrl);
    assert.deepEqual(hydrationErrors(errors), [], `${path}: hydration errors: ${errors.join("\n")}`);
    assert.match(text, /news-index-query|Fixture article|Тестовая статья/, `${path}: hydrated tree keeps the listing`);
  }
});

test("the shared hero copy covers all 17 locales and the fallback template uses it when the renderer is unavailable", async () => {
  assert.equal(NEWS_LIST_COPY_LOCALES.length, 17);
  for (const locale of NEWS_LIST_COPY_LOCALES) {
    const hero = newsListHeroCopy(locale);
    assert.ok(hero.title && hero.subtitle && hero.eyebrow, locale);
  }
  assert.equal(newsListHeroCopy("zh-TW").title, newsListHeroCopy("zh-Hant").title);
  const html = await (await fetchPage("/vi/news", { ASSETS: assets })).text();
  assert.match(html, /data-nexualpha-ssr-fallback="news-list"/, "no renderer: hand-written fallback");
  assert.deepEqual(h1Texts(html), [newsListHeroCopy("vi").title], "fallback H1 equals the client heading");
  assert.match(html, new RegExp(`<div class="news-hero__badge">${newsListHeroCopy("vi").eyebrow.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</div>`));
});

test("a renderer that throws is logged and the listing falls back to the hand-written template with summary-only state", async () => {
  const logged = [];
  const originalError = console.error;
  console.error = (...args) => logged.push(args.join(" "));
  try {
    const env = { ASSETS: assets, NEWS_SSR_RENDER: async () => { throw new Error("renderer down"); } };
    const response = await fetchPage("/news/category/guide", env);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /data-nexualpha-ssr-fallback="news-list"/);
    assert.deepEqual(h1Texts(html), [newsCategoryCopy("guide", "en").label]);
    assert.ok(logged.some((line) => /news listing SSR failed .*renderer down/.test(line)), `logged: ${logged.join(" | ")}`);
    const state = prerenderState(html);
    assert.equal(state.newsArticles[0].content, undefined);
  } finally {
    console.error = originalError;
  }
});
