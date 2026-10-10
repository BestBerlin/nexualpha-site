import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.js";
import { readFile } from "node:fs/promises";
import { loadNewsArticleBySlug } from "../src/data/news-feed-client.js";
const realFeed = JSON.parse(await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8"));
const real = realFeed.articles.find((a) => a.status === "PUBLISHED");

const article = (slug, extra = {}) => ({ slug, status: "PUBLISHED", publishedAt: "2026-10-09T00:00:00Z", title: { en: slug }, summary: { en: "s" }, content: { en: `Body links to /news/linked-one and /news/${slug}` }, sources: [{ id: "a", url: "https://example.com" }], seo: { noindex: false }, ...extra });
const feed = { articles: [article("target-one"), article("linked-one"), article("unrelated", { content: { en: "x".repeat(50000) } })] };
const env = { ASSETS: { fetch: async (req) => new URL(req.url).pathname === "/content/news-feed.json" ? new Response(JSON.stringify(feed)) : new Response("", { status: 404 }) } };

test("article endpoint returns one full article plus summaries of linked articles only", async () => {
  const res = await worker.fetch(new Request("https://nexualpha.com/api/news/article/target-one"), env);
  assert.equal(res.status, 200);
  const body = await res.json();
  // 2026-10-10 news library: related articles (same category / shared platforms) are added as summaries, so the
  // unrelated article now appears as a summary-only "related research" row (all fixtures share a category).
  assert.equal(body.articles[0].slug, "target-one");
  assert.ok(body.articles.some((a) => a.slug === "linked-one"), "linked articles stay included");
  assert.ok(body.articles.slice(1).every((a) => a.content === undefined), "only the target ships a body");
  assert.ok(body.articles[0].content, "target keeps its body");
  assert.ok(!JSON.stringify(body).includes("x".repeat(1000)), "unrelated bodies are not shipped");
  assert.equal((await worker.fetch(new Request("https://nexualpha.com/api/news/article/missing"), env)).status, 404);
  assert.equal((await worker.fetch(new Request("https://nexualpha.com/api/news/article/..%2Fetc"), env)).status, 404);
});

test("client loader uses the article endpoint and falls back to the full feed", async () => {
  const calls = [];
  const realEnv = { ASSETS: { fetch: async (req) => new URL(req.url).pathname === "/content/news-feed.json" ? new Response(JSON.stringify(realFeed)) : new Response("", { status: 404 }) } };
  const rows = await loadNewsArticleBySlug(real.slug, async (u) => { calls.push(u); return worker.fetch(new Request(`https://nexualpha.com${u}`), realEnv); });
  assert.equal(calls[0], `/api/news/article/${real.slug}`);
  assert.ok(rows.some((a) => a.slug === real.slug && a.content), "the normalized article keeps its body");
  const fallback = [];
  await loadNewsArticleBySlug("target-one", async (u) => { fallback.push(u); return u.startsWith("/api/") ? new Response("", { status: 500 }) : new Response(JSON.stringify(feed)); });
  assert.deepEqual(fallback, ["/api/news/article/target-one", "/content/news-feed.json"]);
});
