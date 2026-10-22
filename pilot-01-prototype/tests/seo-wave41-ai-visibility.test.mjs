import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { applyNewsSearchStateToFeed } from "../src/data/news-search-state.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { newsArticleFaqEntries, normalizeNewsFeed } from "../src/data/news-feed-client.js";
import { routeMetadata } from "../worker/index.js";
import { retainRetrievalNews } from "../scripts/retrieval-news-policy.mjs";

const prioritySlugs = [
  "binance-okx-proof-of-reserves-disclosure-audit",
  "bybit-vs-okx-subaccounts-risk-isolation-api-controls",
  "coinbase-address-allowlist-setup-network-hold-tutorial",
  "how-to-set-up-binance-anti-phishing-code",
  "jupiter-vs-raydium-solana-swap-routing-execution-controls",
  "verify-official-crypto-exchange-website",
];

const rawFeed = JSON.parse(await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8"));
const articles = normalizeNewsFeed(applyNewsSearchStateToFeed(rawFeed));

test('retrieval retention respects withdrawal, noindex, canonical and source boundaries', () => {
  const source = articles.find((entry) => entry.slug === prioritySlugs[0]);
  const article = { ...source, seo: { ...source.seo, noindex: false, canonical: `https://nexualpha.com/news/${source.slug}` } };
  assert.equal(retainRetrievalNews(article), true);
  assert.equal(retainRetrievalNews({ ...article, status: 'DRAFT' }), false);
  assert.equal(retainRetrievalNews({ ...article, sources: [] }), false);
  assert.equal(retainRetrievalNews({ ...article, seo: { ...article.seo, noindex: true } }), false);
  assert.equal(retainRetrievalNews({ ...article, seo: { ...article.seo, canonical: 'https://nexualpha.com/topics/no-kyc' } }), false);
  assert.equal(retainRetrievalNews(article, [{ url: article.seo.canonical, disposition: 'accessible_noindex' }]), false);
});

function schemas(value) {
  const graph = value?.["@graph"] || value || [];
  return Array.isArray(graph) ? graph : [graph];
}

function findSchema(value, type) {
  return schemas(value).find((entry) => entry?.["@type"] === type);
}

function assets() {
  return {
    fetch: async (request) => {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/content/news-feed.json") {
        return new Response(JSON.stringify(rawFeed), { headers: { "content-type": "application/json" } });
      }
      return new Response("missing", { status: 404 });
    },
  };
}

test("Wave41 priority articles expose truthful FAQ schema in client and worker metadata", async () => {
  for (const slug of prioritySlugs) {
    const article = articles.find((entry) => entry.slug === slug);
    assert.ok(article, `${slug} missing from normalized feed`);
    const faqEntries = newsArticleFaqEntries(article, "en");
    assert.ok(faqEntries.length >= 4, `${slug} needs at least four visible FAQ entries`);

    const client = computeRouteSeo({ url: `/news/${slug}`, article, locale: "en" }).schemas;
    const worker = (await routeMetadata(new URL(`https://nexualpha.com/news/${slug}`), { ASSETS: assets() })).schema;

    for (const [surface, value] of [["client", client], ["worker", worker]]) {
      const newsArticle = findSchema(value, "NewsArticle");
      const faq = findSchema(value, "FAQPage");
      assert.ok(newsArticle, `${slug} ${surface} NewsArticle`);
      assert.equal(newsArticle.author?.name, "NexuAlpha Research Desk", `${slug} ${surface} author`);
      assert.equal(newsArticle.publisher?.name, "NexuAlpha", `${slug} ${surface} publisher`);
      assert.ok(newsArticle.datePublished, `${slug} ${surface} datePublished`);
      assert.ok(newsArticle.dateModified, `${slug} ${surface} dateModified`);
      assert.ok(newsArticle.citation.length >= 4, `${slug} ${surface} source citations`);
      assert.ok(faq, `${slug} ${surface} FAQPage`);
      assert.deepEqual(faq.mainEntity.map((entry) => entry.name), faqEntries.map((entry) => entry.question));
      assert.ok(faq.mainEntity.every((entry) => entry.acceptedAnswer?.text), `${slug} ${surface} FAQ answers`);
    }
  }
});

test("llms surfaces retain eligible visited articles as dated source records without resurrecting withdrawn search content", async () => {
  const outputDir = await mkdtemp(path.join(tmpdir(), "nexualpha-llms-test-"));
  let llms, full;
  try {
    execFileSync(process.execPath, [fileURLToPath(new URL("../scripts/generate-public-llms.mjs", import.meta.url))], {
      env: { ...process.env, NEXUALPHA_LLMS_OUTPUT_DIR: outputDir }, timeout: 90_000, stdio: "pipe",
    });
    [llms, full] = await Promise.all(["llms.txt", "llms-full.txt"].map(name => readFile(path.join(outputDir, name), "utf8")));
  } finally { await rm(outputDir, { recursive: true, force: true }); }

  for (const text of [llms, full]) {
    assert.match(text, /## Reviewed news article answers/);
    for (const slug of prioritySlugs) {
      const pattern = new RegExp(`https://nexualpha[.]com/news/${slug}`);
      const article = articles.find(entry => entry.slug === slug);
      if (retainRetrievalNews(article)) assert.match(text, pattern, `${slug}: eligible retrieval record`);
      else assert.doesNotMatch(text, pattern, `${slug}: withdrawn/noindex record stays out`);
    }
    assert.match(text, /author: NexuAlpha Research Desk/);
    assert.match(text, /published: 2026-/);
    assert.match(text, /official\/source citations: \d+/);
    assert.match(text, /do not prove current account eligibility, live fees, user benefits or outcomes/i);
  }
});
