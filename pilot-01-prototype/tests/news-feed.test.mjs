import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { importBatch, importArticlePackage, writeBatchFeed } from "../scripts/import-nexualpha-content.mjs";
import { exchangeUrl, localizedNewsSummary, localizedNewsTitle, loadNewsArticleSummaries, loadNewsArticles, newsArticleUrl, normalizeNewsFeed, normalizeNewsFeedSummaries, projectNewsFeedForRoute } from "../src/data/news-feed-client.js";
import productionFeed from "../public/content/news-feed.json" with { type: "json" };
import sitesWorker from "../worker/index.js";

const requiredPasses = ["source_and_claim", "editorial_quality", "seo_aeo_geo", "compliance_and_commercial"];
const publicWorkflowResiduePatterns = [
  /\bStatus:\s*staged(?:\s+for\s+NexuAlpha\s+publication\s+review)?\.?/i,
  /状态：待\s*NexuAlpha\s*发布复核。?/,
  /\barticle\.json\b/i,
  /\bsources\.md\b/i,
  /"sourceStatus":"(?:STAGED|PUBLISHED)"/i,
];

async function writePackage(root, name, overrides = {}) {
  const dir = path.join(root, name);
  await mkdir(dir, { recursive: true });
  const article = {
    version: 1,
    slug: name,
    status: "STAGED",
    titles: {
      en: "Hyperliquid vs dYdX: Source-Backed Mechanics",
      "zh-Hans": "Hyperliquid vs dYdX：源头核验机制对比",
    },
    bodyFiles: {
      en: "article.en.md",
      "zh-Hans": "article.zh-Hans.md",
    },
    entities: ["Hyperliquid", "dYdX"],
    sources: [{
      id: "source-1",
      url: "https://example.com/research",
      publisher: "Example Research",
      title: "Primary source",
      accessedAt: "2026-09-07T11:43:01Z",
      primary: true,
    }],
    claims: [{ id: "c1", text: "A sourced claim", sourceIds: ["source-1"], risk: "low" }],
    seo: { description: "A source-backed comparison for a live NexuAlpha feed." },
    review: {
      passes: requiredPasses,
      verdict: "NARROWED_AND_PASS",
      reviewedAt: "2026-09-07T11:43:01Z",
    },
    ...overrides,
  };
  await writeFile(path.join(dir, "article.json"), `${JSON.stringify(article, null, 2)}\n`);
  if (overrides.skipBodies !== true) {
    await writeFile(path.join(dir, "article.en.md"), "# Title\n\nStatus: staged\n\n## Direct answer\n\nThis is the English body with sources and practical details.");
    await writeFile(path.join(dir, "article.zh-Hans.md"), "# 标题\n\n状态：暂存\n\n## 直接答案\n\n这是简体中文正文，包含来源和可核验细节。");
  }
  return dir;
}

test("imports reviewed source-backed article packages into a published runtime feed", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-"));
  await writePackage(root, "hyperliquid-vs-dydx", {
    seo: {
      description: "A source-backed comparison for a live NexuAlpha feed.",
      internalLinkTargets: [
        "/venues/hyperliquid",
        "https://nexualpha.com/venues/dydx",
        "https://example.com/venues/not-internal",
      ],
    },
  });
  const { feed, health } = await importBatch(root, { publish: true });

  assert.equal(health.importedCount, 1);
  assert.equal(health.rejectedCount, 0);
  assert.equal(feed.articles[0].slug, "hyperliquid-vs-dydx");
  assert.equal(feed.articles[0].title.en, "Hyperliquid vs dYdX: Source-Backed Mechanics");
  assert.equal(feed.articles[0].sources.length, 1);
  assert.equal(feed.articles[0].status, "PUBLISHED");
  assert.equal(feed.articles[0].seo.noindex, false);
  assert.equal(feed.articles[0].seo.canonical, "https://nexualpha.com/news/hyperliquid-vs-dydx");
  assert.equal(feed.articles[0].summary["zh-Hans"], "这是简体中文正文，包含来源和可核验细节。");
  assert.deepEqual(feed.articles[0].seo.internalLinkTargets, [
    "/exchanges/hyperliquid",
    "https://nexualpha.com/exchanges/dydx",
    "https://example.com/venues/not-internal",
  ]);
  assert.deepEqual(feed.articles[0].availableLocales, ["en", "zh-Hans"]);
  assert.deepEqual(feed.articles[0].relatedVenues, ["hyperliquid", "dydx"]);
});

test("imported English search summaries end at sentence boundaries", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-summary-boundary-"));
  await writePackage(root, "summary-boundary", {
    seo: {
      description: [
        "A removed spot pair is not necessarily a delisted asset, and the two events require different actions.",
        "Users must separately verify whether the base asset remains tradable against another quote currency and whether deposits or withdrawals remain open.",
      ].join(" "),
    },
  });
  const { feed } = await importBatch(root, { publish: true });
  const article = feed.articles[0];

  assert.equal(article.summary.en, "A removed spot pair is not necessarily a delisted asset, and the two events require different actions.");
  assert.equal(article.seo.description, article.summary.en);
  assert.match(article.summary.en, /[.!?]$/);
});

test("updating a reviewed article preserves its original publication date and author", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-history-"));
  await writePackage(root, "preserve-history", {
    publishedAt: "2026-09-01T08:00:00Z",
    updatedAt: "2026-09-05T08:00:00Z",
    author: "Original Research Team",
    review: { passes: requiredPasses, reviewedAt: "2026-09-22T01:00:00Z" },
  });
  const { feed, health } = await importBatch(root, { publish: true });
  assert.equal(health.rejectedCount, 0);
  assert.equal(feed.articles[0].publishedAt, "2026-09-01T08:00:00.000Z");
  assert.equal(feed.articles[0].updatedAt, "2026-09-22T01:00:00.000Z");
  assert.equal(feed.articles[0].author, "Original Research Team");
  assert.equal(feed.articles[0].seo.canonical, "https://nexualpha.com/news/preserve-history");
});

test("an invalid explicit publication date is rejected instead of silently replaced", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-invalid-date-"));
  const packageDir = await writePackage(root, "invalid-history", { publishedAt: "not-a-date" });
  assert.equal((await importArticlePackage(packageDir, { publish: true })).ok, false);
});

test("packages without an original date retain the established first-publication fallback", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-first-date-"));
  const packageDir = await writePackage(root, "first-publication");
  const result = await importArticlePackage(packageDir, { publish: true });
  assert.equal(result.ok, true);
  assert.equal(result.article.publishedAt, "2026-09-07T11:43:01.000Z");
  assert.equal(result.article.author, "NexuAlpha Research Desk");
});

test("importer repairs a source SEO description truncated after a semicolon-delimited clause", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-truncated-summary-"));
  await writePackage(root, "truncated-summary", {
    seo: {
      description: "NexuAlpha's listing-timeline radar scores whether a venue separates deposit, pre-open, trading and withdrawal milestones; identifies the exact network and token contract; explains launch price controls; discloses regional eligibil",
    },
    aeo: {
      directAnswer: "The complete answer keeps regional eligibility and a live status path visible before a user acts.",
    },
  });
  const { feed } = await importBatch(root, { publish: true });
  const article = feed.articles[0];

  assert.equal(
    article.summary.en,
    "The complete answer keeps regional eligibility and a live status path visible before a user acts.",
  );
  assert.equal(article.seo.description, article.summary.en);
  assert.match(article.summary.en, /[.!?]$/);
});

test("rejects packages that are not reviewed, sourced, localized, and staged or published", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-reject-"));
  const validDir = await writePackage(root, "valid-package");
  const badStatusDir = await writePackage(root, "bad-status", { status: "DRAFT" });
  const badReviewDir = await writePackage(root, "bad-review", { review: { passes: requiredPasses.slice(0, 2) } });
  const badSourcesDir = await writePackage(root, "bad-sources", { sources: [] });
  const badBodiesDir = await writePackage(root, "bad-bodies", { skipBodies: true });

  assert.equal((await importArticlePackage(validDir)).ok, true);
  assert.equal((await importArticlePackage(badStatusDir)).ok, false);
  assert.equal((await importArticlePackage(badReviewDir)).ok, false);
  assert.equal((await importArticlePackage(badSourcesDir)).ok, false);
  assert.equal((await importArticlePackage(badBodiesDir)).ok, false);
});

test("browser feed client normalizes safe articles and fails closed for bad data or fetch errors", async () => {
  const articles = normalizeNewsFeed({
    articles: [{
      slug: "valid-article",
      status: "PUBLISHED",
      category: "research",
      categoryName: { en: "Research", "zh-Hans": "研究" },
      publishedAt: "2026-09-07T00:00:00Z",
      readTime: "4 min",
      author: "NexuAlpha",
      title: { en: "Valid", "zh-Hans": "有效" },
      summary: { en: "Valid summary", "zh-Hans": "有效摘要" },
      content: { en: "Valid content", "zh-Hans": "有效正文" },
      sources: [{ url: "https://example.com/a", publisher: "Example", title: "A" }],
      relatedVenues: ["kraken", "bad slug"],
    }, {
      slug: "missing-source",
      status: "PUBLISHED",
      title: { en: "Bad", "zh-Hans": "坏" },
    }],
  });

  assert.equal(articles.length, 1);
  assert.deepEqual(articles[0].relatedVenues, ["kraken"]);
  assert.equal(newsArticleUrl("valid-article", "zh-Hans"), "/zh-hans/news/valid-article");
  assert.equal(newsArticleUrl("valid-article", "en"), "/news/valid-article");
  assert.equal(newsArticleUrl("valid-article", "ja"), "/ja/news");
  assert.equal(newsArticleUrl("valid-article", "ar"), "/ar/news");
  assert.equal(exchangeUrl("kraken", "en"), "/exchanges/kraken");
  assert.deepEqual(await loadNewsArticles(async () => ({ ok: false })), []);
  assert.deepEqual(await loadNewsArticles(async () => { throw new Error("network"); }), []);
});

test("browser news summary loader keeps list runtime free of article bodies and source payloads", async () => {
  const feed = {
    articles: [{
      slug: "summary-only-runtime",
      status: "PUBLISHED",
      category: "research",
      categoryName: { en: "Research", "zh-Hans": "研究" },
      publishedAt: "2026-09-18T00:00:00Z",
      readTime: "4 min",
      author: "NexuAlpha",
      title: { en: "Summary runtime", "zh-Hans": "摘要运行时" },
      summary: { en: "Only compact card copy should remain.", "zh-Hans": "只保留紧凑卡片文案。" },
      content: {
        en: "Long English article body that belongs on the detail page, not the news list runtime.",
        "zh-Hans": "很长的中文文章正文应该留在详情页，而不是进入新闻列表运行时。",
      },
      sources: [{ url: "https://example.com/a", publisher: "Example", title: "A" }],
      relatedVenues: ["binance", "okx"],
      seo: { description: "Search payload" },
      aeo: { directAnswer: "Answer payload" },
      geo: { visibility: "Geo payload" },
    }],
  };

  const [summary] = normalizeNewsFeedSummaries(feed);
  assert.equal(summary.slug, "summary-only-runtime");
  assert.deepEqual(summary.relatedVenues, ["binance", "okx"]);
  assert.equal(summary.title.en, "Summary runtime");
  assert.equal(summary.summary["zh-Hans"], "只保留紧凑卡片文案。");
  assert.equal("content" in summary, false);
  assert.equal("sources" in summary, false);
  assert.equal("seo" in summary, false);
  assert.equal("aeo" in summary, false);
  assert.equal("geo" in summary, false);

  const loaded = await loadNewsArticleSummaries(async () => ({
    ok: true,
    async json() { return feed; },
  }));
  assert.deepEqual(loaded, [summary]);
  const requests = [];
  await loadNewsArticleSummaries(async (url) => {
    requests.push(url);
    return { ok: true, async json() { return feed; } };
  }, { locale: "zh-Hans" });
  assert.deepEqual(requests, ["/content/news-feed-page-1.zh-Hans.json"]);

  const [directSummary] = normalizeNewsFeedSummaries({
    articles: [{
      slug: "direct-summary-runtime",
      status: "PUBLISHED",
      category: "rates",
      categoryName: { en: "Rates", "zh-Hans": "费率" },
      publishedAt: "2026-09-18T01:00:00Z",
      title: { en: "Direct summary", "zh-Hans": "直接摘要" },
      summary: { en: "A future summary endpoint can omit article bodies.", "zh-Hans": "未来摘要端点可以省略文章正文。" },
      relatedVenues: ["kraken"],
      availableLocales: ["en", "zh-Hans"],
    }],
  });
  assert.equal(directSummary.slug, "direct-summary-runtime");
  assert.deepEqual(directSummary.availableLocales, ["en", "zh-Hans"]);
  assert.equal("content" in directSummary, false);
  assert.equal("sources" in directSummary, false);

  const fallbackRequests = [];
  assert.deepEqual(await loadNewsArticleSummaries(async (url) => {
    fallbackRequests.push(url);
    return { ok: false };
  }), []);
  assert.deepEqual(fallbackRequests, ["/content/news-feed-page-1.en.json", "/content/news-feed-summary.json", "/content/news-feed.json"]);
  assert.deepEqual(await loadNewsArticleSummaries(async () => { throw new Error("network"); }), []);
});

test("news summary normalization accepts locale-compacted hydration payloads", () => {
  const summaries = normalizeNewsFeedSummaries([{
    slug: "hydration-summary-only",
    status: "PUBLISHED",
    category: "research",
    categoryName: { en: "Source-Backed Research" },
    publishedAt: "2026-09-28T00:12:00.000Z",
    readTime: "4 min",
    author: "NexuAlpha Research Desk",
    title: { en: "Hydration summary only" },
    summary: { en: "SSR only keeps the current locale in the hydration state." },
    relatedVenues: ["binance"],
    availableLocales: ["en", "zh-Hans"],
  }]);

  assert.equal(summaries.length, 1);
  assert.equal(summaries[0].slug, "hydration-summary-only");
  assert.equal(summaries[0].title.en, "Hydration summary only");
  assert.equal(summaries[0].summary.en, "SSR only keeps the current locale in the hydration state.");
});

test("international news display locales receive local-language summaries without claiming translated bodies", () => {
  const [article] = normalizeNewsFeed({
    articles: [{
      slug: "bitget-okx-fee-boundary",
      status: "PUBLISHED",
      category: "rates",
      categoryName: { en: "Rates", "zh-Hans": "费率" },
      publishedAt: "2026-09-18T00:00:00Z",
      readTime: "4 min",
      author: "NexuAlpha",
      title: { en: "Bitget and OKX fee boundary", "zh-Hans": "Bitget 与 OKX 费率边界" },
      summary: { en: "English source summary.", "zh-Hans": "中文摘要。" },
      content: { en: "English source body.", "zh-Hans": "中文正文。" },
      sources: [{ url: "https://example.com/a", publisher: "Example", title: "A" }],
      relatedVenues: ["bitget", "okx"],
    }],
  });

  const expectedMarkers = {
    ja: "出典確認済みリサーチ",
    ko: "출처 검증 리서치",
    tr: "Kaynak doğrulamalı araştırma",
    es: "Investigación verificada por fuentes",
    "pt-BR": "Pesquisa verificada por fontes",
    ar: "بحث موثق بالمصادر",
  };

  for (const [locale, marker] of Object.entries(expectedMarkers)) {
    const title = localizedNewsTitle(article, locale);
    const summary = localizedNewsSummary(article, locale);
    assert.notEqual(title, article.title.en, `${locale} title should not fall back to the raw English title`);
    assert.notEqual(summary, article.summary.en, `${locale} summary should not fall back to the raw English summary`);
    assert.match(title, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(summary, /Bitget \/ OKX/);
    assert.equal(article.content[locale], undefined, `${locale} body remains unclaimed until human review`);
  }
});

test("the highest-intent article has an explicitly reviewed multilingual decision summary", () => {
  const article = normalizeNewsFeed({ articles: [{
    slug: "coinbase-vs-kraken-stock-and-etf-trading-boundary-comparison",
    status: "PUBLISHED",
    publishedAt: "2026-09-19T00:00:00Z",
    title: { en: "Coinbase vs Kraken", "zh-Hans": "Coinbase 与 Kraken" },
    summary: { en: "Official boundary review.", "zh-Hans": "官方边界审阅。" },
    content: { en: "Reviewed source-backed body.", "zh-Hans": "已审阅的来源正文。" },
    sources: [{ title: "Official source", publisher: "Example", url: "https://example.com/source" }],
  }] }).at(0);
  assert.equal(article.title.ja, "CoinbaseとKrakenの株式・ETF取引の境界を比較");
  assert.equal(article.summary["pt-BR"].startsWith("Resume"), true);
  assert.equal(article.content.ja, undefined);
});

test("the first three high-intent articles expose reviewed summaries in every priority locale", () => {
  const rows = [
    "crypto-platform-stock-access-disclosure-radar-brokerage-tokenized-perp-boundaries",
    "direct-stock-brokerage-vs-tokenized-equities-vs-tradfi-perps-rights-map",
  ].map((slug) => normalizeNewsFeed({ articles: [{
    slug, status: "PUBLISHED", publishedAt: "2026-09-19T00:00:00Z",
    title: { en: "English title", "zh-Hans": "简体标题" },
    summary: { en: "English summary.", "zh-Hans": "简体摘要。" },
    content: { en: "Reviewed source-backed body.", "zh-Hans": "已审阅的来源正文。" },
    sources: [{ title: "Official source", publisher: "Example", url: "https://example.com/source" }],
  }] }).at(0));
  for (const row of rows) for (const locale of ["ja", "ko", "tr", "es", "pt-BR", "ar"]) {
    assert.ok(row.title[locale]);
    assert.ok(row.summary[locale]);
    assert.equal(row.content[locale], undefined);
  }
});

test("the fourth and fifth high-intent articles keep reviewed locale summaries", () => {
  const slugs = [
    "how-to-unlock-kraken-pro-stock-trading-and-verify-equities-eligibility",
    "kraken-coinbase-stock-trading-expansion-crypto-exchange-brokerage-readiness",
  ];
  for (const slug of slugs) {
    const article = normalizeNewsFeed({ articles: [{
      slug, status: "PUBLISHED", publishedAt: "2026-09-19T00:00:00Z",
      title: { en: "English title", "zh-Hans": "简体标题" },
      summary: { en: "English summary.", "zh-Hans": "简体摘要。" },
      content: { en: "Reviewed source-backed body.", "zh-Hans": "已审阅的来源正文。" },
      sources: [{ title: "Official source", publisher: "Example", url: "https://example.com/source" }],
    }] }).at(0);
    assert.ok(article.title.ja);
    assert.ok(article.summary.ar);
    assert.equal(article.content.ja, undefined);
  }
});

test("news route projection keeps hydration payload compact for list and detail routes", () => {
  const fullArticle = normalizeNewsFeed({
    articles: [{
      slug: "localized-projection",
      status: "PUBLISHED",
      category: "research",
      categoryName: { en: "Research", "zh-Hans": "研究", ja: "リサーチ" },
      publishedAt: "2026-09-18T00:00:00Z",
      readTime: "4 min",
      author: "NexuAlpha",
      title: { en: "English title", "zh-Hans": "中文标题", ja: "日本語タイトル" },
      summary: { en: "English summary.", "zh-Hans": "中文摘要。", ja: "日本語の要約。" },
      content: {
        en: "Long verified English body that should stay off the list payload.",
        "zh-Hans": "已核验中文正文。",
      },
      sources: [{ url: "https://example.com/a", publisher: "Example", title: "A" }],
      relatedVenues: ["binance"],
      seo: { description: "Search payload" },
      aeo: { directAnswer: "Answer payload" },
      geo: { visibility: "Geo payload" },
    }],
  });

  const [listProjection] = projectNewsFeedForRoute("/news", fullArticle, "ja");
  assert.deepEqual(Object.keys(listProjection.title).sort(), ["en", "ja"].sort());
  assert.equal(listProjection.title.ja, "日本語タイトル");
  assert.equal("content" in listProjection, false);
  assert.equal("sources" in listProjection, false);


  const listRows = Array.from({ length: 30 }, (_, index) => ({ ...fullArticle[0], slug: `localized-projection-${index}`, publishedAt: new Date(Date.UTC(2026, 8, 18, 0, 0, index)).toISOString() }));
  assert.equal(projectNewsFeedForRoute("/news", listRows, "ja").length, 24);
  assert.equal(projectNewsFeedForRoute("/news/category/research/page/2", listRows, "ja")[0].content, undefined);

  const [detailProjection] = projectNewsFeedForRoute("/news/localized-projection", fullArticle, "ja");
  assert.equal(detailProjection.content.en, "Long verified English body that should stay off the list payload.");
  assert.equal(detailProjection.content["zh-Hans"], undefined);
  assert.equal(detailProjection.sources.length, 1);
  assert.equal(detailProjection.seo.description, "Search payload");
});

test("published feed merge is idempotent and retains earlier articles", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-merge-"));
  const firstBatch = path.join(root, "batch-one");
  const secondBatch = path.join(root, "batch-two");
  const output = path.join(root, "output");
  await mkdir(firstBatch);
  await mkdir(secondBatch);
  await writePackage(firstBatch, "first-article");
  await writePackage(secondBatch, "second-article");

  await writeBatchFeed(firstBatch, output, { publish: true, merge: true });
  const result = await writeBatchFeed(secondBatch, output, { publish: true, merge: true });
  const repeated = await writeBatchFeed(secondBatch, output, { publish: true, merge: true });

  assert.deepEqual(result.feed.articles.map((article) => article.slug).sort(), ["first-article", "second-article"]);
  assert.equal(repeated.feed.articleCount, 2);
  assert.equal(repeated.health.totalCount, 2);
});

test("Wave41 OAI-visited articles expose current source boundaries and complete search summaries", () => {
  const bySlug = new Map(productionFeed.articles.map((article) => [article.slug, article]));
  const slugs = [
    "binance-okx-proof-of-reserves-disclosure-audit",
    "bybit-vs-okx-subaccounts-risk-isolation-api-controls",
    "coinbase-address-allowlist-setup-network-hold-tutorial",
    "how-to-set-up-binance-anti-phishing-code",
    "jupiter-vs-raydium-solana-swap-routing-execution-controls",
    "verify-official-crypto-exchange-website",
  ];

  for (const slug of slugs) {
    const article = bySlug.get(slug);
    assert.ok(article, `${slug} must remain on its existing canonical`);
    assert.equal(article.status, "PUBLISHED");
    assert.equal(article.seo.noindex, false);
    assert.equal(article.seo.canonical, `https://nexualpha.com/news/${slug}`);
    assert.ok(article.summary.en.length >= 100 && article.summary.en.length <= 165, `${slug} summary should be a complete compact sentence`);
    assert.equal(article.seo.description, article.summary.en, `${slug} should not expose the old mid-word truncated description`);
    assert.match(article.summary.en, /[.!?]$/);
  }

  const subaccounts = bySlug.get("bybit-vs-okx-subaccounts-risk-isolation-api-controls");
  assert.match(subaccounts.content.en, /14 days of inactivity/);
  assert.match(subaccounts.content.en, /demo-trading keys/);

  const jupiter = bySlug.get("jupiter-vs-raydium-solana-swap-routing-execution-controls");
  assert.match(jupiter.content.en, /Jupiter now recommends Swap V2/);
  assert.match(jupiter.content.en, /no longer actively maintained/);
  assert.match(jupiter.content.en, /## API version boundary/);
  assert.deepEqual(jupiter.relatedVenues, ["jupiter", "raydium"]);
  for (const sourceId of ["jupiter-v2-order", "jupiter-v2-execute", "jupiter-v1-migration"]) {
    assert.ok(jupiter.sources.some((source) => source.id === sourceId), `${sourceId} source is required`);
  }

  const reserves = bySlug.get("binance-okx-proof-of-reserves-disclosure-audit");
  assert.match(reserves.content.en, /snapshot is taken monthly/);
  assert.match(reserves.content.en, /not a real-time asset display/);
  assert.ok(reserves.sources.some((source) => source.id === "binance-por-verify"));

  const antiPhishing = bySlug.get("how-to-set-up-binance-anti-phishing-code");
  assert.match(antiPhishing.content.en, /6 to 8 characters/);
  assert.match(antiPhishing.content.en, /at least three of uppercase letters, lowercase letters, digits and underscores/);
  assert.match(antiPhishing.content.en, /no other special characters/);

  const coinbase = bySlug.get("coinbase-address-allowlist-setup-network-hold-tutorial");
  assert.match(coinbase.content.en, /Coinbase\.com documents Profile > Settings > Allow list/);
  assert.match(coinbase.content.en, /Coinbase Exchange publishes a separate Address Book workflow/);

  const verifySite = bySlug.get("verify-official-crypto-exchange-website");
  assert.match(verifySite.content.en, /registrable domain/);
  assert.match(verifySite.content.en, /HTTPS is required, but it is not enough/);
});

test("indexable production news summaries and descriptions do not end mid-sentence", () => {
  for (const article of productionFeed.articles) {
    if (article.seo?.noindex !== false) continue;
    for (const [field, value] of [
      ["summary.en", article.summary?.en],
      ["seo.description", article.seo?.description],
    ]) {
      const text = String(value || "").trim();
      assert.ok(text.length >= 40, `${article.slug} ${field} should be meaningful`);
      assert.match(text, /[.!?]$/, `${article.slug} ${field} must end with sentence punctuation`);
    }
  }
});

test("every published feed article survives browser normalization in both indexable locales", () => {
  const published = productionFeed.articles.filter((article) => article.status === "PUBLISHED");
  const normalized = normalizeNewsFeed(productionFeed);

  assert.equal(normalized.length, published.length, "published feed and browser-visible feed must stay aligned");
  for (const article of normalized) {
    assert.deepEqual(article.availableLocales, ["en", "zh-Hans"], `${article.slug} must remain available in both indexed locales`);
    assert.ok(article.summary.en, `${article.slug} must expose an English summary`);
    assert.ok(article.summary["zh-Hans"], `${article.slug} must expose a Simplified Chinese summary`);
  }
});

test("public feed rejects staging-only language in the rendered body", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-stage-copy-"));
  const packageDir = await writePackage(root, "staging-copy");
  await writeFile(path.join(packageDir, "article.en.md"), "# Title\n\n## Direct answer\n\nThe current package remains staged until a route exists.");
  assert.equal((await importArticlePackage(packageDir, { publish: true })).ok, false);
});

test("public feed rejects publication workflow residue in the rendered body", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-publication-residue-"));
  const packageDir = await writePackage(root, "publication-residue");
  await writeFile(
    path.join(packageDir, "article.en.md"),
    [
      "# Title",
      "",
      "## Direct answer",
      "",
      "Status: staged for NexuAlpha publication review.",
      "",
      "Evidence snapshot. The material claims below must map to the source IDs in article.json and sources.md.",
    ].join("\n"),
  );
  await writeFile(
    path.join(packageDir, "article.zh-Hans.md"),
    [
      "# 标题",
      "",
      "## 直接答案",
      "",
      "状态：待 NexuAlpha 发布复核。",
      "",
      "证据快照：本文结论不能替代 article.json 与 sources.md 中的来源映射。",
    ].join("\n"),
  );

  assert.equal((await importArticlePackage(packageDir, { publish: true })).ok, false);
});

test("public feed allows legitimate technical references to article.json and sources.md", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-technical-files-"));
  const packageDir = await writePackage(root, "technical-file-format-reference");
  await writeFile(
    path.join(packageDir, "article.en.md"),
    [
      "# Title",
      "",
      "## Direct answer",
      "",
      "This technical tutorial explains how a local article.json manifest and a sources.md note can be linted before a developer publishes a documentation package.",
    ].join("\n"),
  );
  await writeFile(
    path.join(packageDir, "article.zh-Hans.md"),
    [
      "# 标题",
      "",
      "## 直接答案",
      "",
      "这是一篇技术教程，说明开发者如何在发布文档包之前检查本地 article.json 清单和 sources.md 说明文件。",
    ].join("\n"),
  );

  assert.equal((await importArticlePackage(packageDir, { publish: true })).ok, true);
});

test("publication rejects internal editorial instructions in otherwise reviewed bodies", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-editorial-residue-"));
  const packageDir = await writePackage(root, "editorial-residue");
  for (const residue of [
    "This is the only comparison table this article needs.",
    "A clean article should include a short conclusion.",
    "## Editorial treatment for future updates\n\nKeep this section for the next editor.",
    "## 内容如何服务 CTA\n\n这里规划站内转化策略。",
  ]) {
    await writeFile(path.join(packageDir, "article.en.md"), `## Direct answer\n\nReader-facing answer.\n\n${residue}`);
    const result = await importArticlePackage(packageDir, { publish: true });
    assert.equal(result.ok, false, residue);
    assert.match(result.reason, /published body still contains/);
  }
});

test("published production feed contains no internal publication workflow residue", () => {
  const offenders = [];
  for (const article of productionFeed.articles) {
    if (article.status !== "PUBLISHED") continue;
    const publicPayload = JSON.stringify({
      slug: article.slug,
      sourceStatus: article.sourceStatus,
      title: article.title,
      summary: article.summary,
      content: article.content,
      seo: article.seo,
      aeo: article.aeo,
      geo: article.geo,
    });
    for (const pattern of publicWorkflowResiduePatterns) {
      if (pattern.test(publicPayload)) offenders.push(`${article.slug}: ${pattern.source}`);
    }
  }

  assert.deepEqual(offenders, []);
});

test("server-rendered news routes expose canonical metadata and fail unknown slugs closed", async () => {
  const indexHtml = "<!doctype html><html><head><meta name=\"description\" content=\"old\"><title>Home</title></head><body><div id=\"root\"></div></body></html>";
  const feed = {
    articles: [{
      slug: "verify-official-crypto-exchange-website",
      status: "PUBLISHED",
      publishedAt: "2026-09-07T00:00:00Z",
      updatedAt: "2026-09-07T01:00:00Z",
      author: "NexuAlpha Research Desk",
      title: { en: "Verified Article", "zh-Hans": "已核验文章" },
      summary: { en: "A verified summary.", "zh-Hans": "已核验摘要。" },
      content: { en: "A verified article body.", "zh-Hans": "已核验文章正文。" },
      seo: { title: "Verified Search Title", description: "A source-backed route description.", noindex: false },
      sources: [{ url: "https://example.com/source" }],
    }],
  };
  const assets = {
    async fetch(request) {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/index.html" || pathname === "/") {
        return new Response(indexHtml, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
      }
      if (pathname === "/content/news-feed.json") {
        return new Response(JSON.stringify(feed), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain" } });
    },
  };

  const response = await sitesWorker.fetch(
    new Request("https://nexualpha.com/news/verify-official-crypto-exchange-website", { headers: { accept: "text/html" } }),
    { ASSETS: assets },
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /<title[^>]*>Verified Search Title — NexuAlpha<\/title>/);
  assert.match(html, /name="description" content="A source-backed route description\."/);
  assert.match(html, /"headline":"Verified Article"/);
  assert.match(html, /rel="canonical" href="https:\/\/nexualpha\.com\/news\/verify-official-crypto-exchange-website"/);
  assert.match(html, /NEXUALPHA_ARTICLE_ROUTE_V1/);
  assert.match(html, /<div id="root" data-nexualpha-client-render="true">/);
  assert.match(html, /"@type":"NewsArticle"/);
  assert.match(html, /name="robots" content="index,follow"/);
  assert.match(html, /hreflang="zh-Hans" href="https:\/\/nexualpha\.com\/zh-hans\/news\/verify-official-crypto-exchange-website"/);

  const chineseResponse = await sitesWorker.fetch(
    new Request("https://nexualpha.com/zh-hans/news/verify-official-crypto-exchange-website", { headers: { accept: "text/html" } }),
    { ASSETS: assets },
  );
  const chineseHtml = await chineseResponse.text();
  assert.match(chineseHtml, /<html lang="zh-Hans"/);
  assert.match(chineseHtml, /<div id="root" data-nexualpha-client-render="true">/);
  assert.match(chineseHtml, /<title[^>]*>已核验文章 — NexuAlpha<\/title>/);
  assert.match(chineseHtml, /rel="canonical" href="https:\/\/nexualpha\.com\/zh-hans\/news\/verify-official-crypto-exchange-website"/);

  assert.match(html, /"datePublished":"2026-09-07T00:00:00Z"/);
  assert.match(html, /"dateModified":"2026-09-07T01:00:00Z"/);
  // Class b: b4c9051 uses the live feed publication gate, not a frozen slug roster.
  feed.articles.push({ ...feed.articles[0], slug: "unknown-unreviewed-article", seo: { ...feed.articles[0].seo, noindex: true } });
  const unreviewed = await sitesWorker.fetch(
    new Request("https://nexualpha.com/news/unknown-unreviewed-article", { headers: { accept: "text/html" } }),
    { ASSETS: assets },
  );
  const unreviewedHtml = await unreviewed.text();
  assert.equal(unreviewed.status, 200);
  assert.match(unreviewedHtml, /<title[^>]*>Verified Search Title — NexuAlpha<\/title>/);
  assert.match(unreviewedHtml, /name="robots" content="noindex,follow"/);
  assert.doesNotMatch(unreviewedHtml, /hreflang=/);
  const missing = await sitesWorker.fetch(
    new Request("https://nexualpha.com/news/not-real", { headers: { accept: "text/html" } }),
    { ASSETS: assets },
  );
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /name="robots" content="noindex,nofollow"/);
});

test("priority research pages provide direct answers and distinct comparison facts without editorial scaffolding", () => {
  const required = {
    "tokenized-treasuries-structure-access-risks": [/## Direct answer/, /## The comparison that matters/, /BUIDL/, /BENJI/, /ownership/i, /redemption/i, /## FAQ/],
    "hyperliquid-vs-dydx": [/## Direct answer/, /## Decision matrix/, /14-day/, /30-day/, /funding/i, /margin/i, /liquidation/i, /## FAQ/],
  };
  for (const [slug, patterns] of Object.entries(required)) {
    const article = productionFeed.articles.find((row) => row.slug === slug);
    assert.ok(article, `${slug} retains its existing route`);
    assert.equal(article.status, "PUBLISHED");
    assert.equal(article.seo.noindex, false);
    assert.equal(article.seo.canonical, `https://nexualpha.com/news/${slug}`);
    assert.equal(article.aeo.reviewedAt, article.updatedAt);
    assert.ok(Date.parse(article.updatedAt) > Date.parse(article.publishedAt));
    assert.ok(article.aeo.directAnswer.length > 120);
    assert.ok(article.aeo.decisionChecklist.length >= 6);
    assert.ok(article.aeo.questions.length >= 4);
    for (const pattern of patterns) assert.match(article.content.en, pattern);
    for (const locale of ["en", "zh-Hans"]) {
      const body = article.content[locale];
      assert.equal((body.match(/^\|[\s:|-]+\|$/gm) || []).length, 1, `${slug}/${locale} keeps one comparison table`);
      assert.ok(!/Search intent shortcut|Page role:|answer-engine extraction|Editorial treatment for future updates|内容如何服务\s*CTA/i.test(body));
    }
    assert.doesNotMatch(article.content.en, /commission|返佣|guaranteed signup|guaranteed registration/i);
    assert.ok(article.seo.description.length >= 120);
    assert.ok(article.seo.internalLinkTargets.length >= 4);
    assert.ok(article.seo.internalLinkTargets.every((target) => !target.startsWith("/venues/")));
    assert.ok(article.sources.every((source) => /^https:/.test(source.url)));
    if (slug === "tokenized-treasuries-structure-access-risks") {
      assert.ok(article.seo.internalLinkTargets.includes("/news/coinbase-vs-kraken"));
      assert.match(article.content.en, /\]\(\/news\/coinbase-vs-kraken\)/);
    } else {
      assert.match(article.content.en, /\]\(\/compare\/hyperliquid-vs-dydx\)/);
    }
  }
});

test("the unrelated OKX migration article retains its reviewed action and source contract", () => {
  const article = productionFeed.articles.find((row) => row.slug === "okx-usd-to-usdc-spot-pair-migration");
  assert.equal(article.aeo.reviewedAt, "2026-09-15T06:24:00.000Z");
  assert.equal(article.geo.reviewedAt, "2026-09-15T06:24:00.000Z");
  assert.equal(article.seo.title, "OKX USD to USDC Migration: Sep 23/30 Checklist");
  assert.equal(article.seo.canonicalStatus, "future");
  assert.ok(`${article.seo.title} — NexuAlpha`.length <= 70);
  assert.ok(article.seo.description.length <= 160);
  for (const pattern of [/## Account-level action map/, /## API field map for developers/, /instId/, /tradeQuoteCcy/, /USDC order book activation/, /Circle USDC terms/]) assert.match(article.content.en, pattern);
  for (const sourceId of ["okx-us-migration", "okx-us-changes", "okx-api-changelog"]) {
    assert.equal(article.sources.find((source) => source.id === sourceId)?.accessedAt, "2026-09-15T06:24:00Z");
  }
});

test("server-rendered tokenized Treasuries article exposes current internal links", async () => {
  const indexHtml = "<!doctype html><html><head><meta name=\"description\" content=\"old\"><title>Home</title></head><body><div id=\"root\"></div></body></html>";
  const assets = {
    async fetch(request) {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/index.html" || pathname === "/") {
        return new Response(indexHtml, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
      }
      if (pathname === "/content/news-feed.json") {
        return new Response(JSON.stringify(productionFeed), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain" } });
    },
  };

  const response = await sitesWorker.fetch(
    new Request("https://nexualpha.com/news/tokenized-treasuries-structure-access-risks", { headers: { accept: "text/html" } }),
    { ASSETS: assets },
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Continue checking/);
  assert.match(html, /href="https:\/\/nexualpha\.com\/exchanges\/coinbase"/);
  assert.match(html, /href="https:\/\/nexualpha\.com\/exchanges\/kraken"/);
  assert.match(html, /href="https:\/\/nexualpha\.com\/news\/coinbase-vs-kraken"/);
  assert.doesNotMatch(html, /href="https:\/\/nexualpha\.com\/venues\//);
});

test("legacy venue page paths are not compatible while exchange profiles are indexable", async () => {
  const indexHtml = "<!doctype html><html><head><meta name=\"description\" content=\"old\"><title>Home</title></head><body><div id=\"root\"></div></body></html>";
  const assets = {
    async fetch(request) {
      const pathname = new URL(request.url).pathname;
      return pathname === "/index.html" || pathname === "/"
        ? new Response(indexHtml, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } })
        : new Response("Not Found", { status: 404, headers: { "content-type": "text/plain" } });
    },
  };

  for (const slug of ["binance", "okx", "coinbase", "kraken"]) {
    const legacy = await sitesWorker.fetch(
      new Request(`https://nexualpha.com/venues/${slug}`, { headers: { accept: "text/html" } }),
      { ASSETS: assets },
    );
    const legacyHtml = await legacy.text();
    assert.equal(legacy.status, 404, slug);
    assert.match(legacyHtml, /NEXUALPHA_NOT_FOUND_ROUTE_V1/, slug);
    assert.match(legacyHtml, /name="robots" content="noindex,nofollow"/, slug);

    const current = await sitesWorker.fetch(
      new Request(`https://nexualpha.com/exchanges/${slug}`, { headers: { accept: "text/html" } }),
      { ASSETS: assets },
    );
    const currentHtml = await current.text();
    assert.equal(current.status, 200, slug);
    assert.match(currentHtml, /NEXUALPHA_VENUE_ROUTE_V1/, slug);
    assert.match(currentHtml, /name="robots" content="index,follow"/, slug);
  }
});

test("merge import refuses to replace a newer reviewed article with an older same-slug package", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-rollback-"));
  const batch = path.join(root, "batch");
  const output = path.join(root, "output");
  await mkdir(batch, { recursive: true });
  await mkdir(output, { recursive: true });
  await writePackage(batch, "same-slug", {
    publishedAt: "2026-09-01T00:00:00Z",
    review: { passes: requiredPasses, reviewedAt: "2026-09-15T00:00:00Z" },
    seo: { description: "Older reviewed article package should not overwrite a newer article." },
    aeo: { directAnswer: "Older reviewed article package should not overwrite a newer article." },
  });
  await writeFile(path.join(output, "news-feed.json"), `${JSON.stringify({
    version: 1,
    generatedAt: "2026-10-01T00:00:00.000Z",
    batchId: "existing",
    articleCount: 1,
    articles: [{
      slug: "same-slug",
      status: "PUBLISHED",
      publishedAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
      title: { en: "Newer reviewed article", "zh-Hans": "较新的文章" },
      summary: { en: "Newer reviewed summary.", "zh-Hans": "较新的摘要。" },
      content: { en: "Newer reviewed body.", "zh-Hans": "较新的正文。" },
      sources: [{ url: "https://example.com/source", publisher: "Example", title: "Source" }],
      seo: { canonical: "https://nexualpha.com/news/same-slug", noindex: false },
      aeo: { directAnswer: "Newer reviewed direct answer." },
    }],
  }, null, 2)}\n`);

  const { feed, health } = await writeBatchFeed(batch, output, { publish: true, merge: true });
  const article = feed.articles.find((row) => row.slug === "same-slug");
  assert.equal(article.updatedAt, "2026-10-01T00:00:00.000Z");
  assert.equal(article.aeo.directAnswer, "Newer reviewed direct answer.");
  assert.deepEqual(health.rollbackBlocked, [{ slug: "same-slug", existingUpdatedAt: "2026-10-01T00:00:00.000Z", incomingUpdatedAt: "2026-09-15T00:00:00.000Z" }]);
});

test("merge import still accepts a newer same-slug reviewed article update", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-forward-update-"));
  const batch = path.join(root, "batch");
  const output = path.join(root, "output");
  await mkdir(batch, { recursive: true });
  await mkdir(output, { recursive: true });
  await writePackage(batch, "same-slug", {
    publishedAt: "2026-09-01T00:00:00Z",
    review: { passes: requiredPasses, reviewedAt: "2026-10-02T00:00:00Z" },
    seo: { description: "Newer reviewed article update should replace the existing article." },
    aeo: { directAnswer: "Newer reviewed article update should replace the existing article." },
  });
  await writeFile(path.join(output, "news-feed.json"), `${JSON.stringify({
    version: 1,
    generatedAt: "2026-10-01T00:00:00.000Z",
    batchId: "existing",
    articleCount: 1,
    articles: [{
      slug: "same-slug",
      status: "PUBLISHED",
      publishedAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-15T00:00:00.000Z",
      title: { en: "Older reviewed article", "zh-Hans": "较旧的文章" },
      summary: { en: "Older reviewed summary.", "zh-Hans": "较旧的摘要。" },
      content: { en: "Older reviewed body.", "zh-Hans": "较旧的正文。" },
      sources: [{ url: "https://example.com/source", publisher: "Example", title: "Source" }],
      seo: { canonical: "https://nexualpha.com/news/same-slug", noindex: false },
      aeo: { directAnswer: "Older reviewed direct answer." },
    }],
  }, null, 2)}\n`);

  const { feed, health } = await writeBatchFeed(batch, output, { publish: true, merge: true });
  const article = feed.articles.find((row) => row.slug === "same-slug");
  assert.equal(article.updatedAt, "2026-10-02T00:00:00.000Z");
  assert.equal(article.aeo.directAnswer, "Newer reviewed article update should replace the existing article.");
  assert.deepEqual(health.rollbackBlocked, []);
});

test("merge import counts one retained article when duplicate older same-slug packages are blocked", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-duplicate-rollback-"));
  const batch = path.join(root, "batch");
  const output = path.join(root, "output");
  await mkdir(batch, { recursive: true });
  await mkdir(output, { recursive: true });
  for (const [dir, reviewedAt] of [["01-old", "2026-09-14T00:00:00Z"], ["02-old", "2026-09-15T00:00:00Z"]]) {
    await writePackage(batch, dir, {
      slug: "same-slug",
      publishedAt: "2026-09-01T00:00:00Z",
      review: { passes: requiredPasses, reviewedAt },
      seo: { description: "Older duplicate reviewed article should not inflate retained article count." },
      aeo: { directAnswer: "Older duplicate reviewed article should not inflate retained article count." },
    });
  }
  await writeFile(path.join(output, "news-feed.json"), `${JSON.stringify({
    version: 1,
    generatedAt: "2026-10-01T00:00:00.000Z",
    batchId: "existing",
    articleCount: 1,
    articles: [{
      slug: "same-slug",
      status: "PUBLISHED",
      publishedAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
      title: { en: "Newer reviewed article", "zh-Hans": "较新的文章" },
      summary: { en: "Newer reviewed summary.", "zh-Hans": "较新的摘要。" },
      content: { en: "Newer reviewed body.", "zh-Hans": "较新的正文。" },
      sources: [{ url: "https://example.com/source", publisher: "Example", title: "Source" }],
      seo: { canonical: "https://nexualpha.com/news/same-slug", noindex: false },
      aeo: { directAnswer: "Newer reviewed direct answer." },
    }],
  }, null, 2)}\n`);

  const { feed, health } = await writeBatchFeed(batch, output, { publish: true, merge: true });
  assert.equal(feed.articleCount, 1);
  assert.equal(feed.articles[0].updatedAt, "2026-10-01T00:00:00.000Z");
  assert.equal(health.rollbackBlocked.length, 2);
  assert.equal(health.retainedCount, 1);
});

test("merge import retained count follows the final winner when older and newer same-slug packages are mixed", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexualpha-news-mixed-rollback-"));
  const batch = path.join(root, "batch");
  const output = path.join(root, "output");
  await mkdir(batch, { recursive: true });
  await mkdir(output, { recursive: true });
  for (const [dir, reviewedAt, answer] of [
    ["01-old", "2026-09-15T00:00:00Z", "First older reviewed article."],
    ["02-new", "2026-10-02T00:00:00Z", "Newest reviewed article wins."],
    ["03-old", "2026-09-20T00:00:00Z", "Later older reviewed article should be blocked."],
  ]) {
    await writePackage(batch, dir, {
      slug: "same-slug",
      publishedAt: "2026-09-01T00:00:00Z",
      review: { passes: requiredPasses, reviewedAt },
      seo: { description: answer },
      aeo: { directAnswer: answer },
    });
  }
  await writeFile(path.join(output, "news-feed.json"), `${JSON.stringify({
    version: 1,
    generatedAt: "2026-10-01T00:00:00.000Z",
    batchId: "existing",
    articleCount: 1,
    articles: [{
      slug: "same-slug",
      status: "PUBLISHED",
      publishedAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
      title: { en: "Existing reviewed article", "zh-Hans": "现有文章" },
      summary: { en: "Existing reviewed summary.", "zh-Hans": "现有摘要。" },
      content: { en: "Existing reviewed body.", "zh-Hans": "现有正文。" },
      sources: [{ url: "https://example.com/source", publisher: "Example", title: "Source" }],
      seo: { canonical: "https://nexualpha.com/news/same-slug", noindex: false },
      aeo: { directAnswer: "Existing reviewed direct answer." },
    }],
  }, null, 2)}\n`);

  const { feed, health } = await writeBatchFeed(batch, output, { publish: true, merge: true });
  const article = feed.articles.find((row) => row.slug === "same-slug");
  assert.equal(article.updatedAt, "2026-10-02T00:00:00.000Z");
  assert.equal(article.aeo.directAnswer, "Newest reviewed article wins.");
  assert.equal(health.rollbackBlocked.length, 2);
  assert.equal(health.retainedCount, 0);
});


async function protectedImportTarget(t, { staged = false, packageDate = "2026-09-15T00:00:00Z", empty = false } = {}) {
 const root = await mkdtemp(path.join(os.tmpdir(), "nexualpha-import-target-"));
 t.after(() => rm(root, {recursive:true, force:true}));
 const batch = path.join(root,"batch"), output = path.join(root,"output");
 await mkdir(batch);await mkdir(output);
 if (!empty) await writePackage(batch,"same-slug",{publishedAt:"2026-09-01T00:00:00Z",review:{passes:requiredPasses,reviewedAt:packageDate}});
 const existing = {version:1,articles:[{slug:"same-slug",status:staged?"STAGED":"PUBLISHED",publishedAt:"2026-09-01T00:00:00Z",updatedAt:"2026-10-02T00:00:00Z",content:{en:"Reviewed newer body.","zh-Hans":"已审核较新正文。"}}]};
 await writeFile(path.join(output,"news-feed.json"),JSON.stringify(existing));
 await writeFile(path.join(output,"news-health.json"),"existing-health-sentinel");
 const before=await Promise.all(["news-feed.json","news-health.json"].map(n=>readFile(path.join(output,n),"utf8")));
 return {root,batch,output,before};
}
async function unchangedImportTarget(f) {
 assert.deepEqual(await Promise.all(["news-feed.json","news-health.json"].map(n=>readFile(path.join(f.output,n),"utf8"))),f.before);
}
test("replace import rejects older same-slug published content without touching feed or health",async(t)=>{
 const f=await protectedImportTarget(t);
 await assert.rejects(writeBatchFeed(f.batch,f.output,{publish:true}),/published feed protection: older/);
 await unchangedImportTarget(f);
});
test("replace import rejects dropping a published article, including an empty batch",async(t)=>{
 for(const empty of [false,true]){
  const f=await protectedImportTarget(t,{empty:true});
  if(!empty)await writePackage(f.batch,"different-slug");
  await assert.rejects(writeBatchFeed(f.batch,f.output,{publish:true}),/published feed protection: missing/);
  await unchangedImportTarget(f);
 }
});
test("staging into a published destination cannot demote an existing article",async(t)=>{
 const f=await protectedImportTarget(t,{packageDate:"2026-10-03T00:00:00Z"});
 await assert.rejects(writeBatchFeed(f.batch,f.output,{publish:false}),/published feed protection: status/);
 await unchangedImportTarget(f);
});
test("complete forward replace remains supported without silently merging unrelated staged rows",async(t)=>{
 const f=await protectedImportTarget(t,{packageDate:"2026-10-03T00:00:00Z"});
 const current=JSON.parse(f.before[0]);current.articles.push({slug:"old-staging",status:"STAGED"});
 await writeFile(path.join(f.output,"news-feed.json"),JSON.stringify(current));
 const {feed}=await writeBatchFeed(f.batch,f.output,{publish:true});
 assert.deepEqual(feed.articles.map(a=>a.slug),["same-slug"]);assert.equal(feed.articles[0].updatedAt,"2026-10-03T00:00:00.000Z");
});
test("candidate generation stays available for absent and staged-only destinations",async(t)=>{
 const f=await protectedImportTarget(t,{staged:true});
 const first=await writeBatchFeed(f.batch,f.output,{publish:false});assert.equal(first.feed.articles[0].status,"STAGED");
 const second=await writeBatchFeed(f.batch,path.join(f.root,"new-candidate"),{publish:false});assert.equal(second.feed.articles[0].status,"STAGED");
});
test("custom merge baseline cannot bypass the actual destination chronology",async(t)=>{
 const f=await protectedImportTarget(t);const alternate=path.join(f.root,"empty-baseline.json");await writeFile(alternate,JSON.stringify({articles:[]}));
 await assert.rejects(writeBatchFeed(f.batch,f.output,{publish:true,merge:true,existingFeedPath:alternate}),/published feed protection: older/);
 await unchangedImportTarget(f);
});
