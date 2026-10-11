// Editorial templates (2026-10-11): article, news index and topic / factbook hubs. Pins the new blocks (lead answer,
// section index, footnote panel, market context slot, lead story, day groups, editorial hub index), their copy in all
// 15 locales, and SSR == hydration for the article and hub routes (the listing routes are covered by
// news-listing-ssr.test.mjs, which runs the same worker path).
import assert from "node:assert/strict";
import test from "node:test";
import worker from "../worker/index.js";
import { newsCategoryCopy } from "../src/data/news-library.js";
import { COLLECTION_HUB_LOCALES, collectionHubCopy, collectionHubIndexCopy, factbookHubItems, topicHubItems } from "../src/data/collection-hubs.js";
import { NEWS_DAY_COPY, groupNewsByDay, relativeDay } from "../src/components/v3/news/news-day-groups.js";
import { MARKET_CONTEXT_COPY, detectArticleAssets, formatFunding, formatPrice, formatUsdShort, marketContextSnapshot } from "../src/components/v3/news/article-market-context.js";
import { createSsrHarness, SHELL_HTML, prerenderState, rootInnerHtml, hydrateInJsdom, hydrationErrors } from "./helpers/ssr-hydration-harness.mjs";

const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar"];

const body = [
  "## The short answer",
  "Bitcoin funding turned negative on 10 October while BTC liquidations stayed below $2 million.",
  "## What changed",
  "BTC perpetual funding on Binance moved from positive to negative. Bitcoin spot was flat.",
  "| Venue | Funding / 8h | Open interest |\n|---|---|---|\n| Binance | -0.0014% | $9.8B |\n| OKX | -0.0007% | $3.1B |",
  "### Why it matters",
  "Negative funding means shorts pay longs.",
  "## Limits",
  "This article does not predict prices.",
].join("\n\n");
const article = {
  slug: "fixture-btc-funding-negative",
  status: "PUBLISHED",
  category: "research",
  categoryName: { en: newsCategoryCopy("research", "en").label },
  publishedAt: "2026-10-11T06:05:00.000Z",
  updatedAt: "2026-10-11T06:05:00.000Z",
  readTime: "4 min",
  author: "NexuAlpha Research Desk",
  title: { en: "Bitcoin funding turns negative: what it means" },
  summary: { en: "BTC funding on Binance and OKX turned negative on 10 October." },
  content: { en: body },
  sources: [
    { id: "a", url: "https://example.com/binance-funding", publisher: "Binance", title: "Funding rate history", publishedAt: "2026-10-10T08:00:00Z" },
    { id: "b", url: "https://example.com/okx-funding", publisher: "OKX", title: "Funding fee rules" },
  ],
  relatedVenues: [],
  seo: { noindex: false },
  availableLocales: ["en"],
};
const others = Array.from({ length: 6 }, (_, index) => ({
  ...article,
  slug: `fixture-other-${index}`,
  title: { en: `Other story ${index}` },
  summary: { en: `Summary ${index}` },
  content: { en: `## The short answer\n\nOther ${index}.` },
  publishedAt: new Date(Date.UTC(2026, 9, 11, 5) - index * 9 * 3_600_000).toISOString(),
}));
const feedText = JSON.stringify({ articles: [article, ...others] });
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

test("copy for the new blocks exists in all 15 locales", () => {
  assert.deepEqual(Object.keys(NEWS_DAY_COPY).sort(), [...LOCALES].sort());
  assert.deepEqual(Object.keys(MARKET_CONTEXT_COPY).sort(), [...LOCALES].sort());
  assert.deepEqual([...COLLECTION_HUB_LOCALES].sort(), [...LOCALES].sort());
  for (const locale of LOCALES) {
    const day = NEWS_DAY_COPY[locale];
    assert.ok(day.latest && day.today && day.yesterday && /3/.test(day.stories(3)), locale);
    for (const kind of ["topics", "factbook"]) {
      const copy = collectionHubCopy(kind, locale);
      for (const key of ["title", "description", "itemLabel", "primaryCta", "secondaryCta", "cardCta"]) assert.ok(copy[key], `${kind}.${locale}.${key}`);
      if (locale !== "en") assert.notEqual(copy.title, collectionHubCopy(kind, "en").title, `${kind}.${locale} title is localized`);
    }
    const ix = collectionHubIndexCopy(locale);
    for (const group of ["CEX", "Perp DEX", "DEX"]) assert.equal(ix.groups[group].length, 2, `${locale}.${group}`);
    assert.match(ix.records(7), /7/);
  }
  assert.equal(collectionHubCopy("topics", "zh-TW").title, collectionHubCopy("topics", "zh-Hant").title);
});

test("day groups are UTC days in feed order; Today / Yesterday only with a reader clock", () => {
  const groups = groupNewsByDay(others);
  assert.deepEqual(groups.map((g) => g.day), ["2026-10-11", "2026-10-10", "2026-10-09"]);
  assert.equal(groups.reduce((n, g) => n + g.rows.length, 0), others.length);
  assert.equal(relativeDay("2026-10-11", null), null, "no clock on the server");
  assert.equal(relativeDay("2026-10-11", Date.UTC(2026, 9, 11, 23)), "today");
  assert.equal(relativeDay("2026-10-10", Date.UTC(2026, 9, 11, 1)), "yesterday");
  assert.equal(relativeDay("2026-10-08", Date.UTC(2026, 9, 11, 1)), null);
});

test("market context: assets come from the article text, figures only from the feed", () => {
  assert.deepEqual(detectArticleAssets({ title: "Bitcoin funding turns negative", body }), ["BTC"]);
  assert.deepEqual(detectArticleAssets({ title: "比特币与以太坊", summary: "" }), ["BTC", "ETH"]);
  assert.deepEqual(detectArticleAssets({ title: "OKX fee schedule", body: "Solana is mentioned once." }), []);
  assert.equal(marketContextSnapshot(null, ["BTC"]), null);
  assert.equal(marketContextSnapshot({ generatedAt: "2026-10-11T06:00:00Z" }, ["BTC"]), null, "no figures: nothing rendered");
  const snap = marketContextSnapshot({
    generatedAt: "2026-10-11T06:28:05.863Z",
    market: { majors: [{ symbol: "BTCUSDT", price: 83024.2, change24hPct: 0.36 }] },
    funding: { rows: [{ symbol: "BTC", binanceRate: -0.00001381, okxRate: null }] },
    liquidations: { h24: { topSymbols: [{ symbol: "OKX:BTCUSDT", usd: 1832125 }, { symbol: "BTCUSDT", usd: 100000 }, { symbol: "OKX:ETHUSDT", usd: 5 }] } },
  }, ["BTC", "SOL"]);
  assert.equal(snap.rows.length, 1, "SOL has no figures and is dropped");
  assert.deepEqual(snap.rows[0], { symbol: "BTC", price: 83024.2, change24hPct: 0.36, fundingBinance: -0.00001381, fundingOkx: null, liquidations24hUsd: 1932125 });
  assert.equal(formatPrice(83024.2), "$83,024");
  assert.equal(formatFunding(-0.00001381), "−0.0014%");
  assert.equal(formatUsdShort(1932125), "$1.93M");
});

test("article SSR: lead answer block, section index (rail + mobile disclosure), footnotes, figures, empty market slot", async () => {
  const html = await harness.render(`https://nexualpha.com/news/${article.slug}`, { newsArticles: [article] });
  assert.match(html, /<div class="news-detail__prose news-detail__prose--lead news-detail__answer" data-lead-kind="short-answer">/);
  assert.match(html, /<div class="nx-rule news-detail__answer-rule"><h2 class="nx-rule__label" id="article-section-0" tabindex="-1">The short answer<\/h2>/);
  assert.match(html, /<time class="nx-rule__stamp" dateTime="2026-10-11T06:05:00.000Z"><span class="nx-rule__date">2026-10-11 · <\/span>06:05 UTC<\/time>/);
  assert.match(html, /<nav class="news-detail__toc"[\s\S]*?<\/nav>/, "desktop section index");
  assert.match(html, /<div class="news-detail__rail-sticky"><nav class="news-detail__toc"/, "the index sits in the sticky rail wrapper");
  assert.match(html, /<details class="news-detail__section-disclosure"><summary><span>Jump to section<\/span><span class="news-detail__section-count">04<\/span><\/summary>/);
  for (const id of ["article-section-0", "article-section-2", "article-section-7", "article-sources"]) assert.match(html, new RegExp(`<a href="#${id}"`), id);
  assert.match(html, /<section class="news-detail__prose news-detail__sources news-detail__footnotes" aria-labelledby="article-sources">/);
  assert.match(html, /<h2 class="nx-rule__label" id="article-sources" tabindex="-1" lang="en" dir="ltr">Sources<\/h2>/);
  assert.match(html, /<li id="article-source-1"><span class="news-detail__footnote-index" aria-hidden="true">01<\/span><a href="https:\/\/example.com\/binance-funding"[^>]*><span class="news-detail__source-meta"><span translate="no" lang="en">Binance<\/span><time dateTime="2026-10-10">2026-10-10<\/time><\/span>/);
  assert.match(html, /<li id="article-source-2">[\s\S]*?<span translate="no" lang="en">OKX<\/span><\/span>/, "an undated source shows no date");
  assert.match(html, /<td class="is-num">-0.0014%<\/td>/);
  assert.match(html, /<td class="is-num">\$9.8B<\/td>/);
  assert.match(html, /<td>Binance<\/td>/, "text cells are not figures");
  assert.match(html, /<p class="news-detail__category"><a class="news-detail__tag" href="\/news\/category\/research"/);
  assert.match(html, /<div class="news-detail__metaline">[\s\S]*?data-testid="article-byline"[\s\S]*?<span class="news-detail__clock"> (?:<!-- -->)?06:05 UTC<\/span>/);
  assert.doesNotMatch(html, /news-market-context/, "market context is client-only and absent from SSR");
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
});

test("article route hydrates without mismatch (worker request-time SSR + jsdom hydrateRoot)", async () => {
  const env = { ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) };
  const path = `/news/${article.slug}`;
  const html = await (await fetchPage(path, env)).text();
  assert.match(html, /news-detail__answer/, "served HTML is the component render");
  const state = prerenderState(html);
  const replay = await harness.render(`https://nexualpha.com${path}`, { newsArticles: state.newsArticles });
  assert.equal(replay, rootInnerHtml(html), "client props render the same markup");
  const { errors, text } = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`);
  assert.deepEqual(hydrationErrors(errors), [], errors.join("\n"));
  assert.match(text, /The short answer/);
});

test("news index SSR: a lead story, then day groups with every other row", async () => {
  const rows = [article, ...others].map(({ content, sources, seo, ...summary }) => summary);
  const html = await harness.render("https://nexualpha.com/news", { newsArticles: rows, newsListing: { category: null, page: 1, total: rows.length, totalPages: 1, libraryTotal: rows.length, counts: {} } });
  assert.match(html, new RegExp(`<article class="news-lead" aria-labelledby="news-lead-title" data-news-lead="${article.slug}">`));
  assert.match(html, /<div class="nx-rule"><span class="nx-rule__label">Latest<\/span><span class="nx-rule__line" aria-hidden="true"><\/span><time class="nx-rule__stamp" dateTime="2026-10-11T06:05:00.000Z">2026-10-11 · 06:05 UTC<\/time><\/div>/);
  assert.match(html, /data-cta-placement="news-card-read"/);
  const days = [...html.matchAll(/data-news-day="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(days, ["2026-10-11", "2026-10-10", "2026-10-09"]);
  assert.match(html, /<h2 class="nx-rule__label" id="news-day-2026-10-11"><bdi dir="ltr">2026-10-11<\/bdi><\/h2>/, "server renders the absolute date (no clock)");
  assert.equal((html.match(/class="news-row"/g) || []).length, others.length, "every non-lead row of the page is listed");
  assert.match(html, /<time class="news-row__time" dateTime="2026-10-11T05:00:00.000Z">05:00<\/time>/);
  assert.doesNotMatch(html, /news-research-index/, "the duplicate title index is gone");
});

for (const kind of ["topics", "factbook"]) {
  test(`${kind} hub: editorial index, localized headings (en, ar), one card link per record, hydration parity`, async () => {
    const items = kind === "factbook" ? factbookHubItems("en") : topicHubItems("en");
    for (const locale of ["en", "ar"]) {
      const prefix = locale === "en" ? "" : `/${locale}`;
      const html = await harness.render(`https://nexualpha.com${prefix}/${kind}`, {});
      const copy = collectionHubCopy(kind, locale);
      assert.match(html, new RegExp(`<h1>${copy.title}</h1>`), `${locale} H1`);
      assert.match(html, /class="v2-shell collection-hub__featured" aria-labelledby="hub-featured-title"/, `${locale} featured row`);
      assert.equal((html.match(new RegExp(`data-cta-placement="${kind}-collection-card"`, "g")) || []).length, items.length, `${locale} one card link per record`);
      assert.ok((html.match(/class="nx-rule"/g) || []).length >= 2, `${locale} data-rule section heads`);
      if (kind === "factbook") {
        const ix = collectionHubIndexCopy(locale);
        for (const group of ["CEX", "Perp DEX", "DEX"]) assert.match(html, new RegExp(`data-hub-group="${group}"[\\s\\S]*?>${ix.groups[group][0]}</h2>`), `${locale} ${group}`);
        assert.match(html, /data-fees="checked"/);
      } else {
        assert.match(html, /data-cta-placement="topics-collection-hero-primary"/);
      }
      if (locale === "ar") assert.match(html, /lang="en" dir="ltr"/, "English record text is marked inside the Arabic page");
    }
    const env = { ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) };
    const served = await (await fetchPage(`/${kind}`, env)).text();
    assert.match(served, /collection-hub__featured/, "request-time SSR serves the component");
    const { errors } = await hydrateInJsdom(harness.vite, served, `https://nexualpha.com/${kind}`);
    assert.deepEqual(hydrationErrors(errors), [], errors.join("\n"));
  });
}
