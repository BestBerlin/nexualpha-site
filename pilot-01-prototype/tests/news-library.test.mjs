// News library (2026-10-10): crawlable pagination, category archives, full-library search and related articles.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import worker, { renderNewsLibrarySitemap } from "../worker/index.js";
import { NEWS_CATEGORY_KEYS, NEWS_LIBRARY_LOCALES, newsCategoryCopy, newsLibraryCopy, paginateNews, parseNewsListingPath, relatedNewsArticles, searchNewsArticles } from "../src/data/news-library.js";

import { primaryVenueResearch, recentEntityArticles } from "../src/data/article-related-links.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const categories = ["guide", "comparison", "exchange-update", "regulation", "rwa", "research"];
const venues = ["binance", "okx", "bybit", "bitget", "kraken", "coinbase"];
const names = { guide: "Guides", comparison: "Comparisons", "exchange-update": "Exchange Updates", regulation: "Regulation", rwa: "RWA & Tokenization", research: "Source-Backed Research" };

// 60 articles, newest first by index: article-00 is the newest. Every 6th article is a guide, etc.
const articles = Array.from({ length: 60 }, (_, index) => {
  const n = String(index).padStart(2, "0");
  const category = categories[index % categories.length];
  return {
    slug: `article-${n}`,
    status: "PUBLISHED",
    category,
    categoryName: { en: names[category], "zh-Hans": `分类${category}` },
    publishedAt: new Date(Date.UTC(2026, 9, 10, 12) - index * 3_600_000).toISOString(),
    readTime: "5 min",
    author: "NexuAlpha Research Desk",
    title: { en: index === 53 ? "Deep archive: Kraken staking withdrawal queue" : `Article ${n} about ${category}`, "zh-Hans": `文章 ${n}` },
    summary: { en: `Summary ${n} for ${category}.`, "zh-Hans": `摘要 ${n}` },
    content: { en: `Body ${n} `.repeat(40), "zh-Hans": `正文 ${n}` },
    sources: [{ id: "s", url: "https://example.com/source", publisher: "Example" }],
    relatedVenues: [venues[index % venues.length]],
    seo: { noindex: false },
    availableLocales: ["en", "zh-Hans"],
  };
});
articles.push({ ...articles[1], slug: "draft-one", status: "DRAFT", title: { en: "Deep archive draft" } });
const feedText = JSON.stringify({ articles });
const shell = "<!doctype html><html><head><title>Shell</title></head><body><div id=\"root\"></div></body></html>";
const env = { ASSETS: { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/content/news-feed.json") return new Response(feedText, { headers: { "content-type": "application/json" } });
  if (pathname === "/index.html") return new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } });
  return new Response("missing", { status: 404 });
} } };
const fetchPage = (pathname) => worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), env);
const hrefs = (html, cls) => [...html.matchAll(new RegExp(`<a class="${cls}[^"]*" href="([^"]+)"`, "g"))].map((match) => match[1]);
const canonical = (html) => html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
const robots = (html) => html.match(/<meta name="robots" content="([^"]+)"/)?.[1];
const state = (html) => JSON.parse(html.match(/id="nexualpha-prerender-state">([^<]+)<\/script>/)?.[1] || "null");
const cardSlugs = (html) => [...html.matchAll(/<h2 class="news-article-card__title"><a href="[^"]*\/news\/([a-z0-9-]+)"/g)].map((match) => match[1]);

test("listing paths parse to canonical pages and reject unknown categories", () => {
  assert.deepEqual(parseNewsListingPath("/news"), { category: null, page: 1, canonicalPath: "/news", redirect: null });
  assert.equal(parseNewsListingPath("/news/page/1").redirect, "/news");
  assert.equal(parseNewsListingPath("/news/category/rwa/page/01").redirect, "/news/category/rwa");
  assert.equal(parseNewsListingPath("/news/category/rwa/page/3").canonicalPath, "/news/category/rwa/page/3");
  assert.equal(parseNewsListingPath("/news/category/memes").invalid, true);
  assert.equal(parseNewsListingPath("/news/some-article"), null);
  for (const locale of NEWS_LIBRARY_LOCALES) {
    const copy = newsLibraryCopy(locale);
    for (const key of ["all", "browse", "previous", "next", "pagination", "searching", "empty", "related"]) assert.ok(copy[key], `${locale}.${key}`);
    assert.match(copy.pageOf(2, 9), /2/);
    assert.match(copy.scope(612), /612/);
    for (const key of NEWS_CATEGORY_KEYS) assert.ok(newsCategoryCopy(key, locale).label && newsCategoryCopy(key, locale).intro, `${locale}.${key}`);
  }
  assert.equal(NEWS_LIBRARY_LOCALES.length, 17);
});

test("/news renders 24 newest articles with crawlable next-page links and a self canonical", async () => {
  const response = await fetchPage("/news");
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.equal(canonical(html), "https://nexualpha.com/news");
  assert.equal(robots(html), "index,follow");
  assert.deepEqual(cardSlugs(html), articles.slice(0, 24).map((article) => article.slug));
  assert.match(html, /<a class="news-pagination__step news-pagination__step--next" href="\/news\/page\/2" rel="next"/);
  assert.doesNotMatch(html, /rel="prev"/);
  assert.deepEqual(hrefs(html, "news-pagination__pill"), ["/news", "/news/page/2", "/news/page/3"]);
  assert.deepEqual(hrefs(html, "news-tab"), ["/news", ...NEWS_CATEGORY_KEYS.map((key) => `/news/category/${key}`)]);
  const hydration = state(html);
  assert.equal(hydration.newsArticles.length, 24);
  assert.deepEqual({ page: hydration.newsListing.page, totalPages: hydration.newsListing.totalPages, total: hydration.newsListing.total }, { page: 1, totalPages: 3, total: 60 });
  assert.equal(hydration.newsArticles[0].content, undefined, "list hydration stays summary-only");
});

test("paginated pages are self-canonical, indexable and link both directions", async () => {
  const response = await fetchPage("/news/page/2");
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.equal(canonical(html), "https://nexualpha.com/news/page/2");
  assert.equal(robots(html), "index,follow");
  assert.match(html, /hreflang="zh-Hans" href="https:\/\/nexualpha\.com\/zh-hans\/news\/page\/2"/);
  assert.match(html, /<title[^>]*>[^<]*Page 2 of 3(?: — NexuAlpha)?<\/title>/); // long titles drop the brand suffix (owner 2026-10-11)
  assert.deepEqual(cardSlugs(html), articles.slice(24, 48).map((article) => article.slug));
  assert.match(html, /href="\/news" rel="prev"/);
  assert.match(html, /href="\/news\/page\/3" rel="next"/);
  const last = await (await fetchPage("/news/page/3")).text();
  assert.equal(cardSlugs(last).length, 12);
  assert.doesNotMatch(last, /rel="next"/);

  const zh = await (await fetchPage("/zh-hans/news/page/2")).text();
  assert.equal(canonical(zh), "https://nexualpha.com/zh-hans/news/page/2");
  assert.equal(robots(zh), "index,follow");
  assert.match(zh, /href="\/zh-hans\/news\/page\/3" rel="next"/);
  assert.match(zh, /第 2 页，共 3 页/);

  const ja = await fetchPage("/ja/news/page/2");
  assert.equal(ja.status, 200);
  assert.equal(robots(await ja.text()), "noindex,follow", "news stays indexable only in en and zh-Hans");

  const first = await fetchPage("/news/page/1");
  assert.equal(first.status, 301);
  assert.equal(first.headers.get("location"), "https://nexualpha.com/news");
  const zhFirst = await fetchPage("/zh-hans/news/category/rwa/page/1");
  assert.equal(zhFirst.headers.get("location"), "https://nexualpha.com/zh-hans/news/category/rwa");
  assert.equal((await fetchPage("/news/page/4")).status, 404);
});

test("category archives render a localized H1, intro, filtered list and canonical", async () => {
  const response = await fetchPage("/news/category/rwa");
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.equal(canonical(html), "https://nexualpha.com/news/category/rwa");
  assert.equal(robots(html), "index,follow");
  assert.match(html, /<h1 class="news-hero__title">RWA &amp; Tokenization<\/h1>/);
  assert.match(html, new RegExp(newsCategoryCopy("rwa", "en").intro.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.deepEqual(cardSlugs(html), articles.filter((article) => article.category === "rwa").map((article) => article.slug));
  assert.match(html, /<a class="news-tab news-tab--active" href="\/news\/category\/rwa" aria-current="page"/);
  assert.doesNotMatch(html, /class="news-pagination"/, "a single archive page has no pagination bar");
  assert.equal(state(html).newsListing.category, "rwa");

  const zh = await (await fetchPage("/zh-hans/news/category/regulation")).text();
  assert.equal(canonical(zh), "https://nexualpha.com/zh-hans/news/category/regulation");
  assert.match(zh, /<h1 class="news-hero__title">监管动态<\/h1>/);
  assert.match(zh, /<html[^>]*lang="zh-Hans"/);
  assert.equal((await fetchPage("/news/category/memes")).status, 404);
});

test("/api/news/search searches the whole library and returns compact rows", async () => {
  const get = async (query) => {
    const response = await worker.fetch(new Request(`https://nexualpha.com/api/news/search?${query}`), env);
    return { status: response.status, headers: response.headers, body: await response.json() };
  };
  const deep = await get("q=kraken%20staking&locale=en");
  assert.equal(deep.status, 200);
  assert.deepEqual(deep.body.articles.map((article) => article.slug), ["article-53"], "finds an article far beyond the first 24");
  assert.equal(deep.body.articles[0].content, undefined);
  assert.equal(deep.body.articles[0].sources, undefined);
  assert.equal(deep.body.libraryTotal, 60, "drafts are not searchable");
  assert.match(deep.headers.get("cache-control"), /max-age=/);

  const zh = await get("q=%E6%96%87%E7%AB%A0%2059&locale=zh-Hans");
  assert.deepEqual(zh.body.articles.map((article) => article.slug), ["article-59"], "localized titles are searchable");
  assert.deepEqual(Object.keys(zh.body.articles[0].title).sort(), ["en", "zh-Hans"]);

  const archive = await get("category=regulation&page=2&limit=4&locale=en");
  assert.equal(archive.body.total, 10);
  assert.equal(archive.body.totalPages, 3);
  assert.deepEqual(archive.body.articles.map((article) => article.slug), articles.filter((article) => article.category === "regulation").slice(4, 8).map((article) => article.slug));
  assert.equal(archive.body.counts.rwa, 10);

  const capped = await get("limit=500");
  assert.equal(capped.body.pageSize, 48);
  assert.equal((await get("category=memes")).status, 400);
  const plural = await get("q=articles%20guides");
  assert.ok(plural.body.total > 0, "plural terms also match the singular");
});

test("article pages server-render five related articles including the two newest", async () => {
  const target = articles[7];
  const html = await (await fetchPage(`/news/${target.slug}`)).text();
  const related = [...html.matchAll(/data-cta-placement="news-detail-related-article"/g)];
  assert.equal(related.length, 5);
  const block = html.match(/<section class="news-detail__related-research"[\s\S]*?<\/section>/)?.[0] || "";
  assert.match(block, /<h2>Related research<\/h2>/);
  const linked = [...block.matchAll(/\/news\/([a-z0-9-]+)"/g)].map((match) => match[1]);
  assert.ok(!linked.includes(target.slug));
  assert.deepEqual(linked.slice(0, 2), ["article-00", "article-01"]);
  for (const slug of linked.slice(2)) {
    const item = articles.find((article) => article.slug === slug);
    assert.ok(item.category === target.category || item.relatedVenues.some((venue) => target.relatedVenues.includes(venue)), slug);
  }
  const hydration = state(html);
  assert.ok(hydration.newsArticles.length > 1, "related summaries hydrate with the article");

  const api = await (await worker.fetch(new Request(`https://nexualpha.com/api/news/article/${target.slug}`), env)).json();
  assert.deepEqual(api.relatedSlugs, recentEntityArticles(target, articles.filter((article) => article.status === "PUBLISHED"), 5, "en").map((article) => article.slug));
  assert.ok(api.articles.slice(1).every((article) => article.content === undefined));
  const olderVenueArticles = primaryVenueResearch(target, articles.filter(article => article.status === "PUBLISHED"), "en");
  assert.equal(olderVenueArticles.length, 4, "fixture supplies all four older venue articles");
  for (const older of olderVenueArticles) assert.ok(api.articles.some(article => article.slug === older.slug), `venue companion ${older.slug}`);
  const localizedApi = await (await worker.fetch(new Request(`https://nexualpha.com/api/news/article/${target.slug}?locale=en`), env)).json();
  assert.deepEqual(localizedApi.relatedSlugs, api.relatedSlugs);
  for (const older of olderVenueArticles) assert.ok(localizedApi.articles.some(article => article.slug === older.slug), `localized companion ${older.slug}`);
});

test("related selection is deterministic: shared platforms first, then newest in the same category", () => {
  const pool = articles.slice(0, 60);
  const picks = relatedNewsArticles(pool[0], pool);
  assert.equal(picks.length, 6);
  assert.deepEqual(picks, relatedNewsArticles(pool[0], [...pool].reverse()));
  assert.ok(picks.every((article) => article.category === pool[0].category));
  assert.ok(searchNewsArticles(pool, { query: "" }).every((article, index, rows) => index === 0 || Date.parse(rows[index - 1].publishedAt) >= Date.parse(article.publishedAt)));
  assert.equal(paginateNews(pool, { category: "guide" }).total, 10);
});

test("news library sitemap helper lists archives while the legacy public endpoint redirects to the sitemap index", async () => {
  const xml = renderNewsLibrarySitemap(articles.filter((article) => article.status === "PUBLISHED"));
  for (const loc of ["https://nexualpha.com/news", "https://nexualpha.com/news/page/3", "https://nexualpha.com/zh-hans/news/page/2", "https://nexualpha.com/news/category/rwa", "https://nexualpha.com/zh-hans/news/category/exchange-update"]) {
    assert.match(xml, new RegExp(`<loc>${loc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</loc>`));
  }
  assert.equal((xml.match(/<url>/g) || []).length, 2 * (3 + 6));
  const response = await worker.fetch(new Request("https://nexualpha.com/news-library-sitemap.xml"), env);
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://nexualpha.com/sitemap.xml");
});

test("React news pages render the same pagination, category links and related research", async () => {
  const temporary = await mkdtemp(path.join(root, "tests/.tmp-news-library-"));
  try {
    const entry = path.join(temporary, "entry.jsx");
    const bundle = path.join(temporary, "bundle.cjs");
    await writeFile(entry, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { NewsListPage } from '../../src/components/v3/news/NewsListPage.jsx';
      import { NewsDetailPage } from '../../src/components/v3/news/NewsDetailPage.jsx';
      const articles = ${JSON.stringify(articles.slice(0, 60))};
      const summary = ({ content, sources, seo, ...rest }) => rest;
      const page2 = articles.slice(24, 48).map(summary);
      const listing = { category: null, page: 2, total: 60, totalPages: 3, libraryTotal: 60, counts: { guide: 10, comparison: 10, 'exchange-update': 10, regulation: 10, rwa: 10, research: 10 } };
      const out = {
        list: renderToStaticMarkup(React.createElement(NewsListPage, { locale: 'en', page: 2, initialArticles: page2, listing })),
        zhArchive: renderToStaticMarkup(React.createElement(NewsListPage, { locale: 'zh-Hans', category: 'rwa', page: 1, initialArticles: articles.filter(a => a.category === 'rwa').map(summary), listing: { category: 'rwa', page: 1, total: 10, totalPages: 1, libraryTotal: 60 } })),
        localPool: renderToStaticMarkup(React.createElement(NewsListPage, { locale: 'en', page: 3, initialArticles: articles.map(summary) })),
        detail: renderToStaticMarkup(React.createElement(NewsDetailPage, { slug: articles[7].slug, locale: 'en', initialArticles: [articles[7], ...articles.filter(a => a.slug !== articles[7].slug).map(a => ({ ...summary(a), seo: a.seo }))] })),
      };
      console.log(JSON.stringify(out));
    `);
    execFileSync(path.join(root, "node_modules/.bin/esbuild"), [entry, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundle}`, "--loader:.css=empty", "--loader:.svg=text", "--loader:.webp=file", "--loader:.json=json", "--log-level=warning"], { cwd: root, stdio: "pipe" });
    const out = JSON.parse(execFileSync("node", [bundle], { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }));

    assert.match(out.list, /<a class="news-pagination__step news-pagination__step--prev" href="\/news" rel="prev"/);
    assert.match(out.list, /href="\/news\/page\/3" rel="next"/);
    assert.match(out.list, /<a class="news-pagination__pill" href="\/news\/page\/2" aria-current="page">2<\/a>/);
    assert.match(out.list, /Page 2 of 3/);
    assert.match(out.list, /Searches all 60 published articles/);
    assert.match(out.list, /<a class="news-tab news-tab--active" href="\/news" aria-current="page"/);
    assert.match(out.list, /href="\/news\/category\/exchange-update"[^>]*>Exchange Updates<span class="news-tab__count">10<\/span>/);
    assert.match(out.list, /article-24/);

    assert.match(out.zhArchive, /<h1 class="news-hero__title">代币化资产<\/h1>/);
    assert.match(out.zhArchive, /href="\/zh-hans\/news\/category\/rwa" aria-current="page"/);
    assert.doesNotMatch(out.zhArchive, /class="news-pagination"/);

    assert.match(out.localPool, /aria-current="page">3<\/a>/, "a full summary pool is paginated locally");
    assert.match(out.localPool, /article-48/);
    assert.doesNotMatch(out.localPool, /article-47"/);

    const related = [...out.detail.matchAll(/data-cta-placement="news-detail-related-article"/g)].length;
    assert.equal(related, 5, "five indexable related articles, including the newest two");
    assert.match(out.detail, /data-news-reading-neighbors/, "older research remains discoverable");
    assert.match(out.detail, /<h2>Related research<\/h2>/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
