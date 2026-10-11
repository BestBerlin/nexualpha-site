// Article embed directive (scorecard D3, 2026-10-11): `::embed <widget> [SYMBOL]` on a line of its own renders the live
// data widget server-side as a lazy, titled iframe in a fixed-height box with a localized caption + tool link, in every
// locale; unknown widgets render nothing; the React SSR and the hydrated markup agree; the Worker fallback emits the
// same block; plain-text surfaces drop the directive; the importer passes it through unchanged.
import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import worker from "../worker/index.js";
import {
  ARTICLE_EMBED_COPY, ARTICLE_EMBED_KINDS, articleEmbedHtml, articleEmbedModel, isolateArticleEmbedDirectives, parseArticleEmbed, stripArticleEmbedDirectives,
} from "../src/data/article-embeds.js";
import { EMBED_KINDS, dataPageCopy } from "../src/data/market-data-pages.js";
import { localizedHref } from "../src/data/locale-routing.js";
import { renderEmbedHtml } from "../server/embed-widgets.mjs";
import { importArticlePackage } from "../scripts/import-nexualpha-content.mjs";
import { createSsrHarness, SHELL_HTML, prerenderState, rootInnerHtml, hydrateInJsdom, hydrationErrors } from "./helpers/ssr-hydration-harness.mjs";

const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"];

test("directive parsing: known widgets and aliases, symbols for funding, unknown = nothing, prose untouched", () => {
  assert.deepEqual(parseArticleEmbed("::embed liquidations"), { kind: "liquidations", symbol: null });
  assert.deepEqual(parseArticleEmbed("  ::embed Liquidations  "), { kind: "liquidations", symbol: null });
  assert.deepEqual(parseArticleEmbed("::embed funding BTC"), { kind: "funding-rates", symbol: "BTC" });
  assert.deepEqual(parseArticleEmbed("::embed funding-rates eth"), { kind: "funding-rates", symbol: "ETH" });
  assert.deepEqual(parseArticleEmbed("::embed liquidations BTC"), { kind: "liquidations", symbol: null }, "liquidations has no symbol filter");
  assert.deepEqual(parseArticleEmbed("::embed calculator"), { kind: null, symbol: null });
  assert.deepEqual(parseArticleEmbed("::embed"), { kind: null, symbol: null });
  assert.deepEqual(parseArticleEmbed("::embed funding <script>"), { kind: null, symbol: null });
  assert.equal(parseArticleEmbed("Funding turned negative. ::embed funding"), null);
  assert.equal(parseArticleEmbed("::embedded text"), null);
  assert.equal(parseArticleEmbed("::embed funding\nmore text"), null, "a directive must be its own paragraph (isolate first)");
  assert.equal(articleEmbedModel({ kind: null }, "en"), null);
  assert.equal(articleEmbedHtml(null), "");
});

test("model: widget heights, tool links and copy in all 17 locales", () => {
  for (const kind of Object.keys(ARTICLE_EMBED_KINDS)) {
    assert.equal(ARTICLE_EMBED_KINDS[kind].height, EMBED_KINDS[kind].height, `${kind} frame height equals the widget height`);
    assert.equal(ARTICLE_EMBED_KINDS[kind].toolPath, EMBED_KINDS[kind].path);
  }
  assert.deepEqual(Object.keys(ARTICLE_EMBED_COPY).sort(), [...LOCALES].sort());
  for (const locale of LOCALES) {
    const copy = ARTICLE_EMBED_COPY[locale];
    assert.equal(copy.liquidations, dataPageCopy(locale).liquidations.h1, `${locale}: same name as the data page`);
    assert.equal(copy["funding-rates"], dataPageCopy(locale).funding.h1, `${locale}: same name as the data page`);
    if (locale !== "en") {
      assert.notEqual(copy.live, ARTICLE_EMBED_COPY.en.live, `${locale}: caption localized`);
      assert.notEqual(copy.open, ARTICLE_EMBED_COPY.en.open, `${locale}: link localized`);
    }
    const liq = articleEmbedModel({ kind: "liquidations" }, locale);
    assert.equal(liq.toolHref, localizedHref("/liquidations", { locale }));
    assert.equal(liq.src, `/embed/liquidations?locale=${encodeURIComponent(locale)}&theme=dark`);
    assert.equal(liq.title, `${dataPageCopy(locale).liquidations.h1} — NexuAlpha`);
    const funding = articleEmbedModel({ kind: "funding-rates", symbol: "BTC" }, locale);
    assert.equal(funding.toolHref, localizedHref("/funding-rates", { locale }));
    assert.match(funding.src, /&symbol=BTC$/);
    assert.equal(funding.height, 400);
    assert.equal(funding.toolLinkText, `${ARTICLE_EMBED_COPY[locale].open}${/^(zh|ja)/.test(locale) ? "：" : locale === "fr" ? " : " : ": "}${ARTICLE_EMBED_COPY[locale]["funding-rates"]}`);
  }
});

test("isolate + strip: a directive glued to prose becomes its own paragraph; plain-text surfaces drop it", () => {
  const glued = "Funding flipped negative.\n::embed funding BTC\nShorts now pay longs.";
  assert.equal(isolateArticleEmbedDirectives(glued), "Funding flipped negative.\n\n::embed funding BTC\n\nShorts now pay longs.");
  assert.equal(isolateArticleEmbedDirectives("No directive\n\n\nhere"), "No directive\n\n\nhere", "content without a directive is untouched");
  assert.equal(stripArticleEmbedDirectives("A\n\n::embed liquidations\n\nB"), "A\n\n\nB");
});

const body = [
  "## The short answer",
  "BTC liquidations stayed below $2 million while funding turned negative.",
  "## What changed",
  "Longs were flushed overnight.",
  "::embed liquidations",
  "Funding moved below zero on Binance.\n::embed funding BTC",
  "::embed calculator",
  "## Limits",
  "This article does not predict prices.",
].join("\n\n");
const article = {
  slug: "fixture-embed-liquidations",
  status: "PUBLISHED",
  category: "research",
  categoryName: { en: "Research" },
  publishedAt: "2026-10-11T06:05:00.000Z",
  updatedAt: "2026-10-11T06:05:00.000Z",
  readTime: "4 min",
  author: "NexuAlpha Research Desk",
  title: { en: "Liquidations fixture", ar: "مقال تجريبي عن التصفيات" },
  summary: { en: "BTC liquidations and funding on 10 October.", ar: "تصفيات BTC والتمويل في 10 أكتوبر." },
  content: { en: body, ar: body.replace("Longs were flushed overnight.", "تمت تصفية المراكز الطويلة ليلًا.") },
  sources: [{ id: "a", url: "https://example.com/binance-funding", publisher: "Binance", title: "Funding rate history" }],
  relatedVenues: [],
  seo: { noindex: false },
  availableLocales: ["en", "ar"],
};
const feedText = JSON.stringify({ articles: [article] });
const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/content/news-feed.json") return new Response(feedText, { headers: { "content-type": "application/json" } });
  if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  return new Response("missing", { status: 404 });
} };

function assertEmbedBlocks(html, locale, label) {
  const figures = [...html.matchAll(/<figure class="news-embed" data-embed-kind="([^"]+)">([\s\S]*?)<\/figure>/g)];
  assert.deepEqual(figures.map((m) => m[1]), ["liquidations", "funding-rates"], `${label}: two known widgets, the unknown one renders nothing`);
  for (const [, kind, inner] of figures) {
    const model = articleEmbedModel({ kind, symbol: kind === "funding-rates" ? "BTC" : null }, locale);
    assert.match(inner, new RegExp(`<div class="news-embed__frame" style="height:${model.height}px">`), `${label}: fixed-height box`);
    assert.match(inner, /<iframe [^>]*loading="lazy"/, `${label}: lazy`);
    assert.ok(inner.includes(`title="${model.title.replace(/'/g, "&#x27;")}"`) || inner.includes(`title="${model.title.replace(/'/g, "&#39;")}"`), `${label}: title attribute (${model.title})`);
    assert.ok(inner.includes(`src="${model.src.replace(/&/g, "&amp;")}"`), `${label}: src ${model.src}`);
    assert.match(inner, new RegExp(`height="${model.height}"`));
    assert.ok(inner.includes(`href="${model.toolHref}">${model.toolLinkText}</a>`), `${label}: caption links to the tool page`);
  }
  assert.doesNotMatch(html, /::embed/, `${label}: the directive text never leaks into the page`);
}

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

for (const locale of ["en", "ar"]) {
  test(`article SSR renders the embeds (${locale}) and hydrates without mismatch`, async () => {
    const env = { ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) };
    const pathname = locale === "en" ? `/news/${article.slug}` : `/ar/news/${article.slug}`;
    const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), env);
    const html = await response.text();
    assert.equal(response.status, 200);
    const root = rootInnerHtml(html);
    assertEmbedBlocks(root, locale, `ssr ${locale}`);
    const state = prerenderState(html);
    assert.equal(await harness.render(`https://nexualpha.com${pathname}`, { newsArticles: state.newsArticles }), root, "client props render the same markup");
    const { errors, inspected } = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${pathname}`, {
      inspect: (window) => [...window.document.querySelectorAll(".news-embed iframe")].map((frame) => frame.getAttribute("src")),
    });
    assert.deepEqual(hydrationErrors(errors), [], errors.join("\n"));
    assert.deepEqual(inspected, [articleEmbedModel({ kind: "liquidations" }, locale).src, articleEmbedModel({ kind: "funding-rates", symbol: "BTC" }, locale).src]);
  });
}

test("worker fallback article HTML (no SSR renderer) emits the same embed blocks", async () => {
  const response = await worker.fetch(new Request(`https://nexualpha.com/news/${article.slug}`, { headers: { accept: "text/html" } }), { ASSETS: assets });
  const html = await response.text();
  assert.match(html, /data-nexualpha-ssr-fallback="news-detail"/);
  // The hydration state carries the raw markdown (the client renders it); the visible document and the head must not.
  const visible = html.replace(/<script type="application\/json" id="nexualpha-prerender-state">[\s\S]*?<\/script>/, "");
  assertEmbedBlocks(visible, "en", "fallback");
});

test("funding widget ?symbol= lists that row first and highlights it", () => {
  const rows = ["ETH", "SOL", "BTC"].map((symbol, index) => ({ symbol, binanceRate: 0.01 * (index + 1), okxRate: -0.01, binanceApr: 10, okxApr: -10 }));
  const feed = { generatedAt: "2026-10-11T06:00:00.000Z", funding: { generatedAt: "2026-10-11T06:00:00.000Z", rows } };
  const plain = renderEmbedHtml("funding-rates", feed, { locale: "en" });
  const focused = renderEmbedHtml("funding-rates", feed, { locale: "en", symbol: "btc" });
  assert.equal(plain.ok, true);
  const first = (html) => html.match(/<tbody><tr[^>]*><th scope="row" translate="no">([^<]+)</)?.[1];
  assert.equal(first(focused.html), "BTC");
  assert.match(focused.html, /<tr class="hl"><th scope="row" translate="no">BTC</);
  assert.notEqual(first(plain.html), "BTC");
  assert.equal(renderEmbedHtml("funding-rates", feed, { locale: "en", symbol: "DOGE" }).html, plain.html, "an unknown symbol changes nothing");
});

test("content importer passes the directive through unchanged", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "embed-import-"));
  try {
    const pkg = path.join(dir, "pkg");
    await mkdir(pkg, { recursive: true });
    const words = Array.from({ length: 80 }, (_, i) => `Funding context sentence number ${i} explains the market move in plain words.`).join(" ");
    const en = `# Liquidations fixture\n\n## The short answer\n\nBTC liquidations stayed below $2 million.\n\n## What changed\n\n${words}\n\n::embed liquidations\n\n${words}\n\n::embed funding BTC\n\n## Limits\n\nNo prediction.\n`;
    const zh = `# 爆仓示例\n\n## 简短回答\n\n${"比特币爆仓金额低于两百万美元，资金费率转负。".repeat(60)}\n\n::embed liquidations\n\n## 局限\n\n不做预测。\n`;
    await writeFile(path.join(pkg, "article.en.md"), en);
    await writeFile(path.join(pkg, "article.zh-Hans.md"), zh);
    const manifest = {
      version: 1, id: "fixture-embed", batchId: "20261011T1200", status: "STAGED", slug: "fixture-embed-import",
      titles: { en: "Liquidations fixture", "zh-Hans": "爆仓示例" }, bodyFiles: { en: "article.en.md", "zh-Hans": "article.zh-Hans.md" },
      sources: [{ id: "s1", url: "https://www.binance.com/en/futures/funding-history", publisher: "Binance", title: "Funding history", primary: true }],
      review: { passes: ["source_and_claim", "editorial_quality", "seo_aeo_geo", "compliance_and_commercial"], verdict: "PASS" },
      seo: { noindex: true, description: "BTC liquidations and funding." }, publishedAt: "2026-10-11T06:00:00.000Z",
    };
    await writeFile(path.join(pkg, "article.json"), JSON.stringify(manifest));
    const result = await importArticlePackage(pkg, {});
    assert.equal(result.ok, true, result.reason);
    const imported = result.article;
    assert.match(imported.content.en, /\n\n::embed liquidations\n\n/);
    assert.match(imported.content.en, /\n\n::embed funding BTC\n\n/);
    assert.match(imported.content["zh-Hans"], /\n\n::embed liquidations\n\n/);
    assert.doesNotMatch(imported.summary.en || "", /::embed/, "the summary never starts with a directive");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
