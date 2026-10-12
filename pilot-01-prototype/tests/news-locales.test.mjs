// Localized news lane (2026-10-10): articles may carry natively written editions in any of the 15 site locales.
// An edition (title + summary + body in that locale) is indexable at /<locale>/news/<slug>; without it the locale
// route keeps today's behaviour (English content, noindex, canonical to the English edition), while internal anchors point to the locale news home.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import worker, { renderLiveNewsSitemap, renderNewsLibrarySitemap, routeMetadata } from "../worker/index.js";
import {
  NEWS_CORE_LOCALES,
  NEWS_INDEXABLE_LOCALES,
  hasNewsArticleLocale,
  newsArticleAvailableLocales,
  newsArticleUrl,
  newsListingPublishedLocales,
  newsSitemapLanguage,
  normalizeNewsFeed,
  normalizeNewsFeedSummaries,
  loadNewsArticleBySlug,
} from "../src/data/news-feed-client.js";
import { paginateNews, sortNewsForLocale } from "../src/data/news-library.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { importBatch } from "../scripts/import-nexualpha-content.mjs";
import { buildNewsSeoFiles } from "../scripts/update-news-seo.mjs";

const NOW = Date.parse("2026-10-10T12:00:00Z");
const words = (prefix, count) => Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`).join(" ");
const trBody = `## Kısa cevap\n\nTürkçe ana gövde: ${words("kelime", 40)}.\n\n## Ayrıntılar\n\n${words("sözcük", 40)}.`;
const ruBody = `## Краткий ответ\n\nРусский текст статьи: ${words("слово", 40)}.\n\n## Подробности\n\n${words("термин", 40)}.`;

function article(slug, extra = {}) {
  return {
    slug,
    status: "PUBLISHED",
    category: "exchange-update",
    categoryName: { en: "Exchange Updates", "zh-Hans": "交易所动态" },
    publishedAt: "2026-10-10T08:00:00Z",
    updatedAt: "2026-10-10T08:30:00Z",
    author: "NexuAlpha Research Desk",
    title: { en: `English title ${slug}`, "zh-Hans": `中文标题 ${slug}` },
    summary: { en: `English summary for ${slug}.`, "zh-Hans": `${slug} 的中文摘要。` },
    content: { en: `## The short answer\n\nEnglish body for ${slug}. ${words("word", 30)}.`, "zh-Hans": `## 简短回答\n\n${slug} 的中文正文。` },
    sources: [{ id: "s1", url: "https://example.com/source", publisher: "Example", title: "Primary source" }, { id: "s2", url: "https://example.org/two", publisher: "Example Org", title: "Second source" }],
    relatedVenues: ["okx"],
    seo: { title: `Search title ${slug}`, description: `Search description for ${slug}.`, noindex: false },
    ...extra,
  };
}

const trArticle = article("okx-turkiye-kayit-rehberi", {
  publishedAt: "2026-10-10T09:00:00Z",
  title: { en: "OKX sign-up guide for Türkiye", "zh-Hans": "OKX 土耳其注册指南", tr: "OKX Türkiye kayıt rehberi: ücretler, KYC ve davet kodu (2026)" },
  summary: { en: "How Turkish users open an OKX account.", "zh-Hans": "土耳其用户如何开设 OKX 账户。", tr: "Türkiye'den OKX hesabı açma adımları, ücretler ve KYC belgeleri." },
  content: { en: "## The short answer\n\nEnglish body about OKX in Türkiye. " + words("word", 30) + ".", "zh-Hans": "## 简短回答\n\n关于 OKX 土耳其的中文正文。", tr: trBody },
  availableLocales: ["en", "zh-Hans", "tr"],
});
const ruArticle = article("bybit-likvidatsii-obzor", {
  publishedAt: "2026-10-10T07:00:00Z",
  title: { en: "Bybit liquidation review", "zh-Hans": "Bybit 清算回顾", ru: "Обзор ликвидаций на Bybit: что произошло и как защитить позицию" },
  summary: { en: "What the liquidation spike means.", "zh-Hans": "清算激增意味着什么。", ru: "Что означает всплеск ликвидаций и как трейдеру снизить риск." },
  content: { en: "## The short answer\n\nEnglish body about Bybit liquidations. " + words("word", 30) + ".", "zh-Hans": "## 简短回答\n\nBybit 清算的中文正文。", ru: ruBody },
  availableLocales: ["en", "zh-Hans", "ru"],
});
const plainArticle = article("binance-fee-update-october");
const feed = { version: 1, generatedAt: "2026-10-10T11:00:00Z", articles: [trArticle, ruArticle, plainArticle] };

const indexHtml = '<!doctype html><html><head><meta name="description" content="old"><title>Home</title></head><body><div id="root"></div></body></html>';
const env = {
  ASSETS: {
    async fetch(request) {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/index.html" || pathname === "/") return new Response(indexHtml, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
      if (pathname === "/content/news-feed.json") return new Response(JSON.stringify(feed), { status: 200, headers: { "content-type": "application/json" } });
      return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain" } });
    },
  },
};
// SEO audit 2026-10-11 #4 (owner-approved, scorecard M3): a locale news listing is indexable only with >= 5 native
// editions. feed5 adds four more Turkish articles so /tr/news crosses the threshold; feed keeps one (noindex listing).
const extraTr = Array.from({ length: 4 }, (_, index) => ({ ...trArticle, slug: `okx-turkiye-ek-${index + 1}`, publishedAt: `2026-10-0${index + 1}T09:00:00Z` }));
const feed5 = { ...feed, articles: [...feed.articles, ...extraTr] };
const envFor = (data) => ({
  ASSETS: {
    async fetch(request) {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/index.html" || pathname === "/") return new Response(indexHtml, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
      if (pathname === "/content/news-feed.json") return new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } });
      return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain" } });
    },
  },
});
const env5 = envFor(feed5);
const page = async (pathname) => {
  const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), env);
  return { status: response.status, html: await response.text() };
};

test("feed schema: editions may use any of the 15 locale keys and stay compatible with en + zh-Hans articles", () => {
  assert.equal(NEWS_INDEXABLE_LOCALES.length, 15);
  assert.deepEqual(NEWS_CORE_LOCALES, ["en", "zh-Hans"]);
  const normalized = normalizeNewsFeed({ articles: [trArticle, ruArticle, plainArticle] });
  const bySlug = (slug) => normalized.find((item) => item.slug === slug);
  const [tr, ru, plain] = [bySlug(trArticle.slug), bySlug(ruArticle.slug), bySlug(plainArticle.slug)];
  assert.deepEqual(plain.availableLocales, ["en", "zh-Hans"]);
  assert.deepEqual(tr.availableLocales, ["en", "zh-Hans", "tr"]);
  assert.equal(tr.title.tr, trArticle.title.tr);
  assert.equal(tr.content.tr.includes("Türkçe ana gövde"), true);
  assert.deepEqual(ru.availableLocales, ["en", "zh-Hans", "ru"]);
  // A locale body without its title/summary is not an edition.
  const partial = normalizeNewsFeed({ articles: [article("partial", { content: { ...plainArticle.content, vi: "## Tóm tắt\n\nThân bài tiếng Việt." } })] })[0];
  assert.deepEqual(partial.availableLocales, ["en", "zh-Hans"]);
  // English is the only required edition.
  const englishOnly = normalizeNewsFeed({ articles: [article("english-only", { title: { en: "Only English" }, summary: { en: "Only English summary." }, content: { en: "## The short answer\n\nEnglish only body." } })] })[0];
  assert.deepEqual(englishOnly.availableLocales, ["en"]);
  assert.deepEqual(newsArticleAvailableLocales(trArticle), ["en", "zh-Hans", "tr"]);
  // Summary rows keep declaring their editions without a body.
  const [trSummary] = normalizeNewsFeedSummaries({ articles: [trArticle] });
  assert.equal("content" in trSummary, false);
  assert.deepEqual(trSummary.availableLocales, ["en", "zh-Hans", "tr"]);
  assert.equal(hasNewsArticleLocale(trSummary, "tr"), true);
  assert.equal(hasNewsArticleLocale(trSummary, "ru"), false);
  assert.deepEqual(newsListingPublishedLocales([trArticle, ruArticle, plainArticle]), ["en", "zh-Hans", "ru", "tr"]);
  assert.deepEqual(newsListingPublishedLocales([plainArticle]), ["en", "zh-Hans"]);
  assert.deepEqual(newsListingPublishedLocales([{ ...trArticle, seo: { noindex: true } }]), ["en", "zh-Hans"]);
  assert.equal(newsSitemapLanguage("tr"), "tr");
  assert.equal(newsSitemapLanguage("zh-Hans"), "zh-cn");
  assert.equal(newsSitemapLanguage("pt-BR"), "pt");
});

test("article links use the locale path only for articles that carry that edition", () => {
  assert.equal(newsArticleUrl(trArticle.slug, "tr", trArticle), "/tr/news/okx-turkiye-kayit-rehberi");
  assert.equal(newsArticleUrl(plainArticle.slug, "tr", plainArticle), "/tr/news");
  assert.equal(newsArticleUrl(plainArticle.slug, "tr"), "/tr/news");
  assert.equal(newsArticleUrl(plainArticle.slug, "zh-Hans", plainArticle), "/zh-hans/news/binance-fee-update-october");
  const ordered = sortNewsForLocale([plainArticle, ruArticle, trArticle], "tr").map((item) => item.slug);
  assert.deepEqual(ordered, [trArticle.slug, plainArticle.slug, ruArticle.slug], "native tr article first, then newest-first");
  assert.deepEqual(paginateNews([plainArticle, ruArticle, trArticle], { locale: "ru" }).rows.map((item) => item.slug), [ruArticle.slug, trArticle.slug, plainArticle.slug]);
  assert.deepEqual(paginateNews([plainArticle, ruArticle, trArticle], { locale: "en" }).rows.map((item) => item.slug), [trArticle.slug, plainArticle.slug, ruArticle.slug]);
});

test("worker route metadata indexes /tr/news/<slug> for an article with a tr body and keeps noindex without it", async () => {
  const localized = await routeMetadata(new URL("https://nexualpha.com/tr/news/okx-turkiye-kayit-rehberi"), env);
  assert.equal(localized.status, 200);
  assert.equal(localized.robots, "index,follow");
  assert.equal(localized.locale, "tr");
  assert.equal(localized.canonical, "https://nexualpha.com/tr/news/okx-turkiye-kayit-rehberi");
  assert.match(localized.title, /^OKX Türkiye kayıt rehberi/);
  assert.deepEqual(localized.alternates.map((item) => `${item.hreflang}=${item.href}`), [
    "en=https://nexualpha.com/news/okx-turkiye-kayit-rehberi",
    "zh-Hans=https://nexualpha.com/zh-hans/news/okx-turkiye-kayit-rehberi",
    "tr=https://nexualpha.com/tr/news/okx-turkiye-kayit-rehberi",
    "x-default=https://nexualpha.com/news/okx-turkiye-kayit-rehberi",
  ]);
  const newsSchema = localized.schema.find((item) => item["@type"] === "NewsArticle");
  assert.equal(newsSchema.inLanguage, "tr");
  assert.equal(newsSchema.headline, trArticle.title.tr);
  assert.equal(newsSchema.mainEntityOfPage["@id"], localized.canonical);

  const english = await routeMetadata(new URL("https://nexualpha.com/news/okx-turkiye-kayit-rehberi"), env);
  assert.equal(english.robots, "index,follow");
  assert.equal(english.canonical, "https://nexualpha.com/news/okx-turkiye-kayit-rehberi");
  assert.ok(english.alternates.some((item) => item.hreflang === "tr"), "English edition links the Turkish edition");

  const withoutBody = await routeMetadata(new URL("https://nexualpha.com/tr/news/binance-fee-update-october"), env);
  assert.equal(withoutBody.status, 200);
  assert.equal(withoutBody.robots, "noindex,follow");
  assert.equal(withoutBody.locale, "en");
  assert.equal(withoutBody.displayLocale, "tr");
  assert.equal(withoutBody.canonical, "https://nexualpha.com/news/binance-fee-update-october");
  assert.deepEqual(withoutBody.alternates, []);

  const ruOnTr = await routeMetadata(new URL("https://nexualpha.com/tr/news/bybit-likvidatsii-obzor"), env);
  assert.equal(ruOnTr.robots, "noindex,follow");
  assert.equal(ruOnTr.canonical, "https://nexualpha.com/news/bybit-likvidatsii-obzor");
  const ru = await routeMetadata(new URL("https://nexualpha.com/ru/news/bybit-likvidatsii-obzor"), env);
  assert.equal(ru.robots, "index,follow");
  assert.equal(ru.canonical, "https://nexualpha.com/ru/news/bybit-likvidatsii-obzor");
  assert.equal(ru.schema.find((item) => item["@type"] === "NewsArticle").inLanguage, "ru");
});

test("worker HTML for a localized edition carries the native body, lang attribute and metadata", async () => {
  const { status, html } = await page("/tr/news/okx-turkiye-kayit-rehberi");
  assert.equal(status, 200);
  assert.match(html, /<html lang="tr"/);
  assert.match(html, /name="robots" content="index,follow"/);
  assert.match(html, /rel="canonical" href="https:\/\/nexualpha\.com\/tr\/news\/okx-turkiye-kayit-rehberi"/);
  assert.match(html, /hreflang="tr" href="https:\/\/nexualpha\.com\/tr\/news\/okx-turkiye-kayit-rehberi"/);
  assert.match(html, /hreflang="x-default" href="https:\/\/nexualpha\.com\/news\/okx-turkiye-kayit-rehberi"/);
  assert.match(html, /"inLanguage":"tr"/);
  assert.match(html, /Türkçe ana gövde/);
  assert.doesNotMatch(html, /news-detail__translation-note/, "no original-language notice when the native edition is shown");

  const fallback = await page("/tr/news/binance-fee-update-october");
  assert.equal(fallback.status, 200);
  assert.match(fallback.html, /name="robots" content="noindex,follow"/);
  assert.match(fallback.html, /rel="canonical" href="https:\/\/nexualpha\.com\/news\/binance-fee-update-october"/);
  assert.doesNotMatch(fallback.html, /hreflang=/);
});

test("locale news index is indexable once it has 5 native articles and lists native articles first", async () => {
  const thin = await routeMetadata(new URL("https://nexualpha.com/tr/news"), env);
  assert.equal(thin.robots, "noindex,follow", "one native Turkish article: listing renders but stays out of the index");
  assert.equal(thin.canonical, "https://nexualpha.com/tr/news");
  assert.deepEqual(thin.alternates, []);
  const tr = await routeMetadata(new URL("https://nexualpha.com/tr/news"), env5);
  assert.equal(tr.robots, "index,follow");
  assert.equal(tr.canonical, "https://nexualpha.com/tr/news");
  assert.deepEqual(tr.alternates.map((item) => item.hreflang), ["en", "zh-Hans", "tr", "x-default"], "ru (1) stays out; zh-Hans has 7");
  const listed = tr.schema.mainEntity.itemListElement.map((item) => item.url);
  assert.equal(listed[0], "https://nexualpha.com/tr/news/okx-turkiye-kayit-rehberi");
  assert.equal(tr.schema.mainEntity.itemListElement[0].item.inLanguage, "tr");
  const trHtml = { html: await (await worker.fetch(new Request("https://nexualpha.com/tr/news", { headers: { accept: "text/html" } }), env5)).text() };
  assert.match(trHtml.html, /name="robots" content="index,follow"/);
  const firstCard = trHtml.html.indexOf("okx-turkiye-kayit-rehberi");
  assert.ok(firstCard > 0 && firstCard < trHtml.html.indexOf("binance-fee-update-october"), "native Turkish article is listed before the English-only article");

  const vi = await routeMetadata(new URL("https://nexualpha.com/vi/news"), env);
  assert.equal(vi.robots, "noindex,follow", "no Vietnamese edition in the feed yet");
  assert.equal(vi.canonical, "https://nexualpha.com/news");
  assert.deepEqual(vi.alternates, []);
  const en = await routeMetadata(new URL("https://nexualpha.com/news"), env);
  assert.equal(en.robots, "index,follow");
});

test("live news sitemap and news-library sitemap include localized URLs with xhtml alternates", () => {
  const live = renderLiveNewsSitemap(feed.articles, NOW);
  assert.match(live, /<loc>https:\/\/nexualpha\.com\/tr\/news\/okx-turkiye-kayit-rehberi<\/loc>/);
  assert.match(live, /<loc>https:\/\/nexualpha\.com\/ru\/news\/bybit-likvidatsii-obzor<\/loc>/);
  assert.doesNotMatch(live, /\/tr\/news\/binance-fee-update-october/);
  const trBlock = live.split("<url>").find((block) => block.includes("<loc>https://nexualpha.com/tr/news/okx-turkiye-kayit-rehberi</loc>"));
  assert.match(trBlock, /hreflang="tr" href="https:\/\/nexualpha\.com\/tr\/news\/okx-turkiye-kayit-rehberi"/);
  assert.match(trBlock, /hreflang="en" href="https:\/\/nexualpha\.com\/news\/okx-turkiye-kayit-rehberi"/);
  assert.match(trBlock, /hreflang="x-default" href="https:\/\/nexualpha\.com\/news\/okx-turkiye-kayit-rehberi"/);
  assert.match(trBlock, /<news:language>tr<\/news:language>/);
  assert.match(trBlock, /<news:title>OKX Türkiye kayıt rehberi/);
  const enBlock = live.split("<url>").find((block) => block.includes("<loc>https://nexualpha.com/news/okx-turkiye-kayit-rehberi</loc>"));
  assert.match(enBlock, /hreflang="tr"/);
  assert.match(enBlock, /<news:language>en<\/news:language>/);
  assert.match(live.split("<url>").find((block) => block.includes("<loc>https://nexualpha.com/zh-hans/news/binance-fee-update-october</loc>")), /<news:language>zh-cn<\/news:language>/);

  const library = renderNewsLibrarySitemap(feed5.articles);
  assert.match(library, /<loc>https:\/\/nexualpha\.com\/tr\/news<\/loc>/);
  assert.doesNotMatch(library, /<loc>https:\/\/nexualpha\.com\/ru\/news<\/loc>/, "one ru edition: below the 5-article threshold");
  assert.doesNotMatch(library, /<loc>https:\/\/nexualpha\.com\/vi\/news<\/loc>/);
  const libraryTr = library.split("<url>").find((block) => block.includes("<loc>https://nexualpha.com/tr/news</loc>"));
  assert.match(libraryTr, /hreflang="tr" href="https:\/\/nexualpha\.com\/tr\/news"/);
  assert.doesNotMatch(libraryTr, /hreflang="ru"/);
  assert.match(libraryTr, /hreflang="x-default" href="https:\/\/nexualpha\.com\/news"/);
  assert.doesNotMatch(renderNewsLibrarySitemap(feed.articles), /\/(?:tr|ru)\/news/, "one native article is not enough");
  // A core-only feed lists English; zh-Hans needs 5 Chinese editions like every other locale.
  const coreLibrary = renderNewsLibrarySitemap([plainArticle]);
  assert.doesNotMatch(coreLibrary, /\/tr\/news/);
  assert.match(coreLibrary, /<loc>https:\/\/nexualpha\.com\/news<\/loc>/);
  assert.doesNotMatch(coreLibrary, /<loc>https:\/\/nexualpha\.com\/zh-hans\/news<\/loc>/);
  assert.match(renderNewsLibrarySitemap(feed5.articles), /<loc>https:\/\/nexualpha\.com\/zh-hans\/news<\/loc>/);
});

test("published news sitemap generator emits localized article URLs with the right news:language", () => {
  const result = buildNewsSeoFiles(feed, { existingSitemap: "", existingLlms: "" });
  const trEntry = result.newsSitemapUrls.find((entry) => entry.loc === "https://nexualpha.com/tr/news/okx-turkiye-kayit-rehberi");
  assert.ok(trEntry, "tr edition is in the Google News sitemap");
  assert.equal(trEntry.language, "tr");
  assert.deepEqual(trEntry.alternates.map((item) => item.hreflang), ["en", "zh-Hans", "tr", "x-default"]);
  assert.equal(result.newsSitemapUrls.find((entry) => entry.loc === "https://nexualpha.com/zh-hans/news/binance-fee-update-october").language, "zh-cn");
  assert.ok(!result.newsSitemapUrls.some((entry) => entry.loc === "https://nexualpha.com/tr/news/binance-fee-update-october"));
  assert.match(result.sitemapFiles["sitemap-articles-ru.xml"], /<loc>https:\/\/nexualpha\.com\/ru\/news\/bybit-likvidatsii-obzor<\/loc>/);
});

test("/api/news/article/<slug> accepts ?locale= and ships the requested edition plus English", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/api/news/article/okx-turkiye-kayit-rehberi?locale=tr"), env);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.locale, "tr");
  assert.equal(body.contentLocale, "tr");
  const [target] = body.articles;
  assert.equal(target.slug, trArticle.slug);
  assert.deepEqual(Object.keys(target.content).sort(), ["en", "tr"]);
  assert.deepEqual(Object.keys(target.title).sort(), ["en", "tr"]);
  assert.deepEqual(target.availableLocales, ["en", "zh-Hans", "tr"]);
  assert.deepEqual(target.routeProjection.availableLocales, ["en", "zh-Hans", "tr"]);

  const fallback = await (await worker.fetch(new Request("https://nexualpha.com/api/news/article/okx-turkiye-kayit-rehberi?locale=vi"), env)).json();
  assert.equal(fallback.contentLocale, "en");
  assert.deepEqual(Object.keys(fallback.articles[0].content), ["en"]);

  const full = await (await worker.fetch(new Request("https://nexualpha.com/api/news/article/okx-turkiye-kayit-rehberi"), env)).json();
  assert.equal("locale" in full, false, "no ?locale= keeps today's full payload");
  assert.deepEqual(Object.keys(full.articles[0].content).sort(), ["en", "tr", "zh-Hans"]);

  const calls = [];
  const rows = await loadNewsArticleBySlug(trArticle.slug, async (url) => { calls.push(url); return worker.fetch(new Request(`https://nexualpha.com${url}`), env); }, { locale: "tr" });
  assert.equal(calls[0], "/api/news/article/okx-turkiye-kayit-rehberi?locale=tr");
  assert.ok(rows.some((row) => row.slug === trArticle.slug && row.content?.tr), "client keeps the Turkish body");
});

test("client SEO mirror indexes a localized edition and keeps the English-only rule for the others", () => {
  const seo = computeRouteSeo({ article: trArticle, locale: "tr", pathname: "/news/okx-turkiye-kayit-rehberi" });
  assert.equal(seo.robots, "index,follow");
  assert.equal(seo.canonical, "https://nexualpha.com/tr/news/okx-turkiye-kayit-rehberi");
  assert.ok(seo.alternates.some((item) => item.hreflang === "tr"));
  const plain = computeRouteSeo({ article: plainArticle, locale: "tr", pathname: "/news/binance-fee-update-october" });
  assert.equal(plain.robots, "noindex,follow");
  assert.equal(plain.canonical, "https://nexualpha.com/news/binance-fee-update-october");
  const listing = computeRouteSeo({ route: { name: "newsList", category: null, page: 1 }, pathname: "/news", locale: "tr", newsArticles: feed5.articles });
  assert.equal(listing.robots, "index,follow");
  const thinListing = computeRouteSeo({ route: { name: "newsList", category: null, page: 1 }, pathname: "/news", locale: "tr", newsArticles: feed.articles });
  assert.equal(thinListing.robots, "noindex,follow", "SSR head mirrors the worker's 5-article rule");
  const emptyListing = computeRouteSeo({ route: { name: "newsList", category: null, page: 1 }, pathname: "/news", locale: "tr", newsArticles: [plainArticle] });
  assert.equal(emptyListing.robots, "noindex,follow");
});

async function writePackage(root, name, { trBodyText = null, extraManifest = {} } = {}) {
  const dir = path.join(root, name);
  await mkdir(dir, { recursive: true });
  const manifest = {
    version: 1,
    slug: name,
    status: "STAGED",
    titles: { en: "OKX sign-up guide for Türkiye: fees, KYC and invite code", "zh-Hans": "OKX 土耳其注册指南", ...(trBodyText ? { tr: "OKX Türkiye kayıt rehberi: ücretler, KYC ve davet kodu (2026)" } : {}) },
    bodyFiles: { en: "article.en.md", "zh-Hans": "article.zh-Hans.md", ...(trBodyText ? { tr: "article.tr.md" } : {}) },
    entities: ["OKX"],
    sources: [
      { id: "s1", url: "https://example.com/research", publisher: "Example Research", title: "Primary source", accessedAt: "2026-10-10T08:00:00Z", primary: true },
      { id: "s2", url: "https://example.org/two", publisher: "Example Org", title: "Second source", accessedAt: "2026-10-10T08:00:00Z", primary: true },
    ],
    claims: [{ id: "c1", text: "A sourced claim", sourceIds: ["s1"], risk: "low" }],
    seo: { description: "A source-backed guide for Turkish OKX users with fees and KYC steps." },
    review: { passes: ["source_and_claim", "editorial_quality", "seo_aeo_geo", "compliance_and_commercial"], verdict: "PASS", reviewedAt: "2026-10-10T08:00:00Z" },
    ...extraManifest,
  };
  await writeFile(path.join(dir, "article.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(dir, "article.en.md"), "# Title\n\n## The short answer\n\nThis is the English body with sources and practical details.");
  await writeFile(path.join(dir, "article.zh-Hans.md"), "# 标题\n\n## 简短回答\n\n这是简体中文正文，包含来源和可核验细节。");
  if (trBodyText) await writeFile(path.join(dir, "article.tr.md"), trBodyText);
  return dir;
}

const sentence = (i) => `Türkiye'deki kullanıcılar için ${i}. adım hesap doğrulamasını ve ücret tablosunu açıklar.`;
const longTr = `# OKX Türkiye kayıt rehberi\n\n## Kısa cevap\n\n${Array.from({ length: 48 }, (_, i) => sentence(i + 1)).join(" ")}\n\n## Ücretler\n\n${Array.from({ length: 48 }, (_, i) => `Komisyon satırı ${i + 1} resmi tabloya göre maker ve taker oranlarını listeler.`).join(" ")}`;

test("importer accepts an optional article.tr.md edition and rejects a thin one", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-locales-"));
  await writePackage(root, "okx-turkiye-kayit", { trBodyText: longTr });
  const { feed: imported, health } = await importBatch(root, { publish: true });
  assert.equal(health.rejectedCount, 0, JSON.stringify(health.rejected));
  const [row] = imported.articles;
  assert.deepEqual(row.availableLocales, ["en", "zh-Hans", "tr"]);
  assert.equal(row.title.tr, "OKX Türkiye kayıt rehberi: ücretler, KYC ve davet kodu (2026)");
  assert.match(row.summary.tr, /^Türkiye'deki kullanıcılar için 1\. adım/);
  assert.match(row.content.tr, /^## Kısa cevap/);
  assert.equal(row.content.en.includes("English body"), true);
  assert.equal(row.content["zh-Hans"].includes("简体中文正文"), true);

  const withSummary = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-locales-"));
  await writePackage(withSummary, "okx-turkiye-ozet", { trBodyText: longTr, extraManifest: { summaries: { tr: "Türkiye'den OKX hesabı açma adımları, ücretler ve KYC belgeleri." } } });
  const summarized = await importBatch(withSummary, { publish: true });
  assert.equal(summarized.feed.articles[0].summary.tr, "Türkiye'den OKX hesabı açma adımları, ücretler ve KYC belgeleri.");

  const thin = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-locales-"));
  await writePackage(thin, "okx-turkiye-ince", { trBodyText: "# Başlık\n\n## Kısa cevap\n\nÇok kısa bir Türkçe gövde." });
  const rejected = await importBatch(thin, { publish: true });
  assert.equal(rejected.health.rejectedCount, 1);
  assert.match(rejected.health.rejected[0].reason, /^tr body is too thin: \d+ words; minimum is 900/);

  const noTitle = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-locales-"));
  await writePackage(noTitle, "okx-turkiye-basliksiz", { trBodyText: longTr, extraManifest: { titles: { en: "OKX sign-up guide for Türkiye: fees, KYC and invite code", "zh-Hans": "OKX 土耳其注册指南" } } });
  const untitled = await importBatch(noTitle, { publish: true });
  assert.equal(untitled.health.rejectedCount, 1);
  assert.match(untitled.health.rejected[0].reason, /missing tr title/);

  // Existing two-edition packages import exactly as before.
  const legacy = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-locales-"));
  await writePackage(legacy, "okx-legacy-package");
  const legacyImport = await importBatch(legacy, { publish: true });
  assert.equal(legacyImport.health.rejectedCount, 0);
  assert.deepEqual(legacyImport.feed.articles[0].availableLocales, ["en", "zh-Hans"]);
  assert.deepEqual(Object.keys(legacyImport.feed.articles[0].content), ["en", "zh-Hans"]);
});
