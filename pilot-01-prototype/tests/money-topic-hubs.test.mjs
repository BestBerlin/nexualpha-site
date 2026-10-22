import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import worker from "../worker/index.js";
import { MONEY_TOPIC_HUBS, moneyTopicArticlePool, moneyTopicArticles, moneyTopicCopy } from "../src/data/money-topic-hubs.js";
import { createSsrHarness, SHELL_HTML, prerenderState, hydrateInJsdom, hydrationErrors } from "./helpers/ssr-hydration-harness.mjs";

const article = (slug, title, day, extra = {}) => ({
  slug, status: "PUBLISHED", category: "research", publishedAt: `2026-10-${String(day).padStart(2, "0")}T00:00:00Z`,
  title: { en: title }, summary: { en: `${title} with official sources.` }, content: { en: `${title}\n\nPublished research.` },
  availableLocales: ["en"], seo: { noindex: false }, ...extra,
});
const pool = [
  ...Array.from({ length: 7 }, (_, index) => article(`fees-${index}`, `Exchange maker fees ${index}`, index + 1)),
  article("referral-rebate-guide", "Referral rebates and account eligibility", 8),
  article("stock-product-guide", "Tokenized stocks and holder rights", 9),
  article("funding-risk-guide", "Funding rates and liquidation risk", 10),
  article("private-fees", "Private exchange fees", 20, { seo: { noindex: true } }),
  article("unreviewed-fees", "Unreviewed fees", 21, { seo: {} }),
  article("draft-fees", "Draft fees", 22, { status: "DRAFT" }),
];

test("money clusters select five unique search-published own-edition articles before projection", () => {
  assert.deepEqual(moneyTopicArticles([...pool, pool[6]], "exchange-fees").map(row => row.slug), ["fees-6", "fees-5", "fees-4", "fees-3", "fees-2"]);
  assert.deepEqual(moneyTopicArticles(pool, "rebates-referrals").map(row => row.slug), ["referral-rebate-guide"]);
  assert.deepEqual(moneyTopicArticles(pool, "tokenized-stocks").map(row => row.slug), ["stock-product-guide"]);
  assert.deepEqual(moneyTopicArticles(pool, "funding-liquidations").map(row => row.slug), ["funding-risk-guide"]);
  assert.deepEqual(moneyTopicArticles(pool, "exchange-fees", "es"), []);
  assert.deepEqual(moneyTopicArticles(pool, "missing"), []);
  assert.equal(moneyTopicArticlePool(pool).length, 8);
  assert.equal(new Set(MONEY_TOPIC_HUBS.map(topic => moneyTopicCopy(topic.id).intro)).size, 4, "each money topic has its own existing-fact introduction");
  assert.equal(moneyTopicCopy("exchange-fees", "es").language, "en", "fallback copy is explicitly labeled English");
  const spanish = pool.map(row => ({ ...row, title: { ...row.title, es: "Comisiones verificadas" }, summary: { ...row.summary, es: "Fuentes publicadas." }, content: { ...row.content, es: "Cuerpo publicado." }, availableLocales: ["en", "es"] }));
  delete spanish[6].content.es;
  assert.deepEqual(moneyTopicArticles(spanish, "exchange-fees", "es").map(row => row.slug), ["fees-5", "fees-4", "fees-3", "fees-2", "fees-1"], "actual body eligibility precedes five-row cap");
});

test("topics requests replace stale manifests with four visible money clusters and identical hydration", async t => {
  const harness = await createSsrHarness();
  t.after(() => harness.close());
  const assets = { fetch: async request => {
    const path = new URL(request.url).pathname;
    if (path === "/content/news-feed.json") return new Response(JSON.stringify({ articles: pool }), { headers: { "content-type": "application/json" } });
    if (path === "/prerender-manifest.json") return new Response(JSON.stringify({ routes: { "/topics|en": { html: "<main><h1>STALE TOPIC SNAPSHOT</h1></main>" } } }), { headers: { "content-type": "application/json" } });
    if (path === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
    return new Response("missing", { status: 404 });
  } };
  const response = await worker.fetch(new Request("https://nexualpha.com/topics", { headers: { accept: "text/html" } }), { ASSETS: assets, NEWS_SSR_RENDER: harness.render });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.doesNotMatch(html, /STALE TOPIC SNAPSHOT/);
  const document = new JSDOM(html).window.document;
  assert.equal(document.querySelectorAll("[data-money-topic]").length, 4);
  for (const topic of MONEY_TOPIC_HUBS) {
    const section = document.querySelector(`[data-money-topic="${topic.id}"]`);
    assert.equal(section.closest("details"), null, "research remains visible outside disclosures");
    assert.equal(section.querySelector("[data-money-topic-guide]").getAttribute("href"), topic.path);
    assert.deepEqual([...section.querySelectorAll("[data-money-topic-article]")].map(link => link.getAttribute("href")), moneyTopicArticles(pool, topic.id).map(row => `/news/${row.slug}`));
  }
  const state = prerenderState(html);
  assert.equal(state.newsArticles.length, 8);
  for (const row of state.newsArticles) {
    assert.equal(row.content, undefined, "article bodies stay out of hub hydration");
    assert.equal(row.sources, undefined, "source arrays stay out of hub hydration");
    assert.equal(row.seo.noindex, false, "publication authority survives summary projection");
  }
  const links = [...document.querySelectorAll("[data-money-topic-article]")].map(link => link.getAttribute("href"));
  const hydrated = await hydrateInJsdom(harness.vite, html, "https://nexualpha.com/topics", { timeoutMs: 250, inspect: window => [...window.document.querySelectorAll("[data-money-topic-article]")].map(link => link.getAttribute("href")) });
  assert.deepEqual(hydrationErrors(hydrated.errors), []);
  assert.deepEqual(hydrated.inspected, links);

  // A client transition can arrive with no /topics article props. Its first render matches the empty SSR
  // surface, then the existing summary endpoint fills all clusters without requiring a reload.
  document.querySelectorAll(".collection-hub__money-articles").forEach(list => list.remove());
  document.querySelector("#nexualpha-prerender-state").textContent = JSON.stringify({ ...state, newsArticles: [] });
  const fetches = [];
  const clientLoaded = await hydrateInJsdom(harness.vite, document.documentElement.outerHTML, "https://nexualpha.com/topics", {
    timeoutMs: 1500,
    fetchImpl: async url => {
      fetches.push(String(url));
      return worker.fetch(new Request(new URL(url, "https://nexualpha.com")), { ASSETS: assets });
    },
    until: window => window.document.querySelectorAll("[data-money-topic-article]").length === 8,
    inspect: window => [...window.document.querySelectorAll("[data-money-topic-article]")].map(link => link.getAttribute("href")),
  });
  assert.ok(fetches.includes("/content/news-feed.json"), "refresh uses the public projection with publication authority, not the static summary that strips seo");
  assert.deepEqual(hydrationErrors(clientLoaded.errors), []);
  assert.deepEqual(clientLoaded.inspected, links);
});
