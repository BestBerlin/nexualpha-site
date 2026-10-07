import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildSync } from "esbuild";
import {
  newsArticleAvailableLocales,
  projectNewsFeedForRoute,
  normalizeNewsFeed,
  normalizeNewsArticle,
  normalizeNewsFeedSummaries,
  newsArticleSeoLocales,
} from "../src/data/news-feed-client.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";

const root = new URL("../", import.meta.url);
const feed = normalizeNewsFeed(JSON.parse(readFileSync(new URL("../public/content/news-feed.json", import.meta.url), "utf8")));
const fullArticle = feed.find((article) => article.slug === "hyperliquid-vs-dydx");

function alternateLanguages(seo) {
  return seo.alternates.map((alternate) => alternate.hreflang);
}

function loadWorkerProducer() {
  const source = `${readFileSync(new URL("../worker/index.js", import.meta.url), "utf8")}\nexport { initialNewsArticlesForRoute, articleSeoLocales, loadNewsFeed };`;
  const built = buildSync({
    stdin: { contents: source, resolveDir: path.join(fileURLToPath(root), "worker"), loader: "js" },
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    logLevel: "silent",
  }).outputFiles[0].text;
  const dir = mkdtempSync(path.join(tmpdir(), "r274-worker-"));
  const file = path.join(dir, "worker-producer.mjs");
  writeFileSync(file, built);
  return import(pathToFileURL(file).href).finally(() => rmSync(dir, { recursive: true, force: true }));
}

test("reviewed news article keeps zh-Hans alternate after hydration projection", () => {
  assert.ok(fullArticle, "fixture article exists");
  assert.deepEqual(newsArticleAvailableLocales(fullArticle), ["en", "zh-Hans"]);
  const projected = projectNewsFeedForRoute("/news/hyperliquid-vs-dydx", [fullArticle], "en")[0];
  assert.deepEqual(Object.keys(projected.title), ["en"], "projection keeps only the current rendered title locale");
  assert.deepEqual(Object.keys(projected.summary), ["en"], "projection keeps only the current rendered summary locale");
  assert.deepEqual(Object.keys(projected.content), ["en"], "projection keeps only the current rendered body locale");
  assert.deepEqual(projected.availableLocales, ["en", "zh-Hans"], "projection retains verified publication locales");
  assert.equal(projected.routeProjection?.source, "nexualpha-news-route-projection-v1", "projection carries the trusted route marker");
  assert.deepEqual(newsArticleAvailableLocales(projected), ["en"], "plain availability still reflects only current rendered fields");
  assert.deepEqual(newsArticleSeoLocales(projected), ["en", "zh-Hans"], "SEO can use the trusted projection marker for alternates");

  const normalizedFullSourceWithMarker = normalizeNewsArticle({ ...fullArticle, routeProjection: projected.routeProjection });
  assert.deepEqual(newsArticleAvailableLocales(normalizedFullSourceWithMarker), ["en", "zh-Hans"], "full article normalization retains verified fields");
  assert.deepEqual(newsArticleSeoLocales(normalizedFullSourceWithMarker), ["en", "zh-Hans"], "entry-server full article normalization preserves the trusted route marker");

  const summaryProjection = normalizeNewsFeedSummaries([projected])[0];
  assert.deepEqual(summaryProjection.routeProjection.availableLocales, ["en", "zh-Hans"], "summary fallback normalization preserves the marker without claiming body publication");

  const reprojection = projectNewsFeedForRoute("/news/hyperliquid-vs-dydx", [projected], "en")[0];
  assert.deepEqual(reprojection.routeProjection.availableLocales, ["en", "zh-Hans"], "reprojecting a trusted route payload preserves the full-source locale proof");
  assert.deepEqual(newsArticleSeoLocales(reprojection), ["en", "zh-Hans"], "second-pass trusted payload keeps alternates through hydration");

  const seo = computeRouteSeo({ pathname: "/news/hyperliquid-vs-dydx", locale: "en", article: reprojection });
  assert.equal(seo.robots, "index,follow");
  assert.deepEqual(alternateLanguages(seo), ["en", "zh-Hans", "x-default"]);
  assert.deepEqual(seo.alternates.map((alternate) => alternate.href), [
    "https://nexualpha.com/news/hyperliquid-vs-dydx",
    "https://nexualpha.com/zh-hans/news/hyperliquid-vs-dydx",
    "https://nexualpha.com/news/hyperliquid-vs-dydx",
  ]);
});

test("fake projected availableLocales cannot publish missing article languages", () => {
  const fake = {
    slug: "fake-news-hydration-article",
    status: "PUBLISHED",
    seo: { noindex: false },
    sources: [{ title: "Source", url: "https://example.com/source" }],
    title: { en: "Fake article" },
    summary: { en: "Fake summary" },
    content: { en: "Fake content" },
    availableLocales: ["en", "zh-Hans"],
  };
  assert.deepEqual(projectNewsFeedForRoute("/news/fake-news-hydration-article", [fake], "en")[0].routeProjection.availableLocales, ["en"], "raw availableLocales are not route proof");
  const seo = computeRouteSeo({ pathname: "/news/fake-news-hydration-article", locale: "en", article: fake });
  assert.equal(seo.robots, "noindex,follow", "unreviewed slug remains outside publication even with fake availableLocales");
  assert.deepEqual(seo.alternates, []);
});

test("worker route producer carries trusted bilingual projection into client SEO", async () => {
  assert.ok(fullArticle, "fixture article exists");
  const { initialNewsArticlesForRoute, articleSeoLocales: workerArticleSeoLocales } = await loadWorkerProducer();
  const [workerProjection] = initialNewsArticlesForRoute("/news/hyperliquid-vs-dydx", [fullArticle], "en", { preserveSsrContent: true });
  assert.deepEqual(Object.keys(workerProjection.content), ["en"], "worker producer keeps route body compact");
  assert.deepEqual(workerProjection.routeProjection.availableLocales, ["en", "zh-Hans"], "worker producer writes full-source locale proof");
  assert.deepEqual(workerArticleSeoLocales(workerProjection), ["en", "zh-Hans"], "worker SEO helper accepts its own trusted projection");

  const [secondPass] = initialNewsArticlesForRoute("/news/hyperliquid-vs-dydx", [workerProjection], "en", { preserveSsrContent: true });
  assert.deepEqual(secondPass.routeProjection.availableLocales, ["en", "zh-Hans"], "worker JSON re-projection does not collapse the trusted locale proof");

  const seo = computeRouteSeo({ pathname: "/news/hyperliquid-vs-dydx", locale: "en", article: secondPass });
  assert.equal(seo.robots, "index,follow");
  assert.deepEqual(alternateLanguages(seo), ["en", "zh-Hans", "x-default"], "client SEO helper receives the worker-produced proof");
});


test("worker raw feed ingestion strips untrusted route projection before reprojecting", async () => {
  const { loadNewsFeed, initialNewsArticlesForRoute, articleSeoLocales: workerArticleSeoLocales } = await loadWorkerProducer();
  const rawArticle = {
    slug: "hyperliquid-vs-dydx",
    status: "PUBLISHED",
    seo: { noindex: false },
    sources: [{ title: "Source", publisher: "Publisher", url: "https://example.com/source" }],
    publishedAt: "2026-09-28T00:00:00.000Z",
    title: { en: "English only title" },
    summary: { en: "English only summary" },
    content: { en: "English only body" },
    availableLocales: ["en", "zh-Hans"],
    routeProjection: {
      source: "nexualpha-news-route-projection-v1",
      locale: "en",
      availableLocales: ["en", "zh-Hans"],
    },
  };
  const env = {
    ASSETS: {
      fetch: async () => new Response(JSON.stringify({ articles: [rawArticle] }), { status: 200, headers: { "content-type": "application/json" } }),
    },
  };
  const loaded = await loadNewsFeed(env, new URL("https://nexualpha.com/news/hyperliquid-vs-dydx"));
  assert.equal(loaded.articles.length, 1);
  assert.equal(loaded.articles[0].routeProjection, undefined, "raw feed routeProjection is not trusted at ingestion");
  const [projected] = initialNewsArticlesForRoute("/news/hyperliquid-vs-dydx", loaded.articles, "en", { preserveSsrContent: true });
  assert.deepEqual(projected.routeProjection.availableLocales, ["en"], "raw feed projection is recomputed from actual localized fields");
  assert.deepEqual(workerArticleSeoLocales(projected), ["en"], "worker SEO helper cannot regain zh-Hans from a raw-feed marker");
  const seo = computeRouteSeo({ pathname: "/news/hyperliquid-vs-dydx", locale: "en", article: projected });
  assert.deepEqual(alternateLanguages(seo), ["en", "x-default"], "client SEO helper does not publish the missing zh-Hans alternate from raw feed data");
});
