import assert from "node:assert/strict";
import test from "node:test";

import { SSR_CACHE_HEADER, createSsrPageCache, isDirectoryPath, isPublicHtmlPath, shouldBypassSsrCache, ssrCacheKey } from "../server/ssr-page-cache.mjs";

const html = (body, status = 200, type = "text/html; charset=utf-8") => new Response(body, { status, headers: { "content-type": type, "cache-control": "public, max-age=300" } });

function harness({ ttlMs = 60_000, fingerprint, maxEntries } = {}) {
  let now = 1_000_000;
  const renders = [];
  const cache = createSsrPageCache({ ttlMs, now: () => now, fingerprint, ...(maxEntries ? { maxEntries } : {}) });
  const render = async (request) => {
    renders.push(request.url);
    const url = new URL(request.url);
    return html(`<html>${url.pathname}${url.search} #${renders.length}</html>`);
  };
  const get = (url, headers = {}, method = "GET") => cache.fetch(new Request(url, { method, headers }), render);
  return { cache, renders, get, advance: (ms) => { now += ms; } };
}

test("directory path matcher covers the plain and locale-prefixed directory only", () => {
  assert.equal(isDirectoryPath("/exchanges"), true);
  assert.equal(isDirectoryPath("/zh-Hans/exchanges"), true);
  assert.equal(isDirectoryPath("/pt-BR/exchanges"), true);
  assert.equal(isDirectoryPath("/ja/exchanges"), true);
  assert.equal(isDirectoryPath("/exchanges/okx"), false);
  assert.equal(isDirectoryPath("/exchanges/"), false);
  assert.equal(isDirectoryPath("/"), false);
  assert.equal(isDirectoryPath("/compare/binance-vs-okx"), false);
});

test("cache key is pathname plus the sorted query, so locale and filters separate entries", () => {
  assert.equal(ssrCacheKey(new URL("https://nexualpha.com/exchanges")), "/exchanges?");
  assert.equal(ssrCacheKey(new URL("https://nexualpha.com/exchanges?product=spot&market=TW")), ssrCacheKey(new URL("https://nexualpha.com/exchanges?market=TW&product=spot")));
  assert.notEqual(ssrCacheKey(new URL("https://nexualpha.com/exchanges?locale=ja")), ssrCacheKey(new URL("https://nexualpha.com/exchanges")));
  assert.notEqual(ssrCacheKey(new URL("https://nexualpha.com/zh-Hans/exchanges")), ssrCacheKey(new URL("https://nexualpha.com/exchanges")));
});

test("session-specific requests bypass the cache", () => {
  assert.equal(shouldBypassSsrCache(new Request("https://nexualpha.com/exchanges")), false);
  assert.equal(shouldBypassSsrCache(new Request("https://nexualpha.com/exchanges", { headers: { cookie: "a=b" } })), false);
  assert.equal(shouldBypassSsrCache(new Request("https://nexualpha.com/exchanges", { headers: { authorization: "Bearer x" } })), true);
  assert.equal(shouldBypassSsrCache(new Request("https://nexualpha.com/exchanges", { headers: { "x-nexualpha-analytics-mode": "smoke" } })), true);
  assert.equal(shouldBypassSsrCache(new Request("https://nexualpha.com/exchanges", { method: "POST" })), true);
});

test("miss renders and stores, hit serves the stored body without rendering again", async () => {
  const { renders, get, cache } = harness();
  const first = await get("https://nexualpha.com/exchanges");
  assert.equal(first.status, 200);
  assert.equal(first.headers.get(SSR_CACHE_HEADER), "miss");
  assert.equal(first.headers.get("cache-control"), "public, max-age=300");
  const firstBody = await first.text();
  const second = await get("https://nexualpha.com/exchanges");
  assert.equal(second.headers.get(SSR_CACHE_HEADER), "hit");
  assert.equal(await second.text(), firstBody);
  assert.equal(renders.length, 1, "the second request did not reach the renderer");
  assert.deepEqual({ hits: cache.stats().hits, misses: cache.stats().misses, size: cache.stats().size }, { hits: 1, misses: 1, size: 1 });
});

test("entries expire after the TTL and are rendered again", async () => {
  const { renders, get, advance, cache } = harness({ ttlMs: 60_000 });
  await get("https://nexualpha.com/exchanges");
  advance(59_000);
  assert.equal((await get("https://nexualpha.com/exchanges")).headers.get(SSR_CACHE_HEADER), "hit");
  advance(2_000);
  const stale = await get("https://nexualpha.com/exchanges");
  assert.equal(stale.headers.get(SSR_CACHE_HEADER), "miss");
  assert.equal(renders.length, 2);
  assert.equal(cache.has("https://nexualpha.com/exchanges"), true);
});

test("locale prefix, locale query and filter query each get their own entry", async () => {
  const { renders, get } = harness();
  await get("https://nexualpha.com/exchanges");
  await get("https://nexualpha.com/zh-Hans/exchanges");
  await get("https://nexualpha.com/exchanges?locale=ja");
  await get("https://nexualpha.com/exchanges?market=TW&product=spot");
  assert.equal(renders.length, 4);
  const zh = await get("https://nexualpha.com/zh-Hans/exchanges");
  assert.equal(zh.headers.get(SSR_CACHE_HEADER), "hit");
  assert.match(await zh.text(), /\/zh-Hans\/exchanges/);
  const tw = await get("https://nexualpha.com/exchanges?product=spot&market=TW");
  assert.equal(tw.headers.get(SSR_CACHE_HEADER), "hit", "query order does not matter");
  assert.equal(renders.length, 4);
});

test("never caches non-200 or non-HTML responses, and caches all public HTML routes", async () => {
  let now = 0;
  const cache = createSsrPageCache({ now: () => now });
  let calls = 0;
  const render = async (request) => {
    calls += 1;
    const url = new URL(request.url);
    if (url.searchParams.get("fail") === "503") return html("<html>down</html>", 503);
    if (url.searchParams.get("fail") === "404") return html("<html>missing</html>", 404);
    if (url.searchParams.get("json") === "1") return html("{}", 200, "application/json");
    return html("<html>ok</html>");
  };
  for (const url of ["https://nexualpha.com/exchanges?fail=503", "https://nexualpha.com/exchanges?fail=404", "https://nexualpha.com/exchanges?json=1"]) {
    const first = await cache.fetch(new Request(url), render);
    assert.equal(first.headers.get(SSR_CACHE_HEADER), null, `${url} is not marked as cacheable`);
    await cache.fetch(new Request(url), render);
  }
  assert.equal(calls, 6, "every failed or non-HTML response was rendered again");
  assert.equal(cache.stats().size, 0);
  await cache.fetch(new Request("https://nexualpha.com/exchanges/okx"), render);
  await cache.fetch(new Request("https://nexualpha.com/"), render);
  assert.equal(cache.stats().size, 2, "venue detail and home are cached");
  assert.equal(cache.stats().bypasses, 0);
});

test("authorization bypasses the cache in both directions", async () => {
  const { renders, get, cache } = harness();
  await get("https://nexualpha.com/exchanges");
  const personal = await get("https://nexualpha.com/exchanges", { authorization: "Bearer test" });
  assert.equal(personal.headers.get(SSR_CACHE_HEADER), null);
  assert.match(await personal.text(), /#2/, "personalised request was rendered, not served from cache");
  assert.equal(renders.length, 2);
  assert.equal(cache.stats().bypasses, 1);
  const shared = await get("https://nexualpha.com/exchanges");
  assert.match(await shared.text(), /#1/, "the personalised render never replaced the shared entry");
});

test("HEAD requests are served from the cache but never populate it", async () => {
  const { renders, get, cache } = harness();
  const head = await get("https://nexualpha.com/exchanges", {}, "HEAD");
  assert.equal(head.headers.get(SSR_CACHE_HEADER), null);
  assert.equal(cache.stats().size, 0);
  await get("https://nexualpha.com/exchanges");
  const cachedHead = await get("https://nexualpha.com/exchanges", {}, "HEAD");
  assert.equal(cachedHead.headers.get(SSR_CACHE_HEADER), "hit");
  assert.equal(await cachedHead.text(), "");
  assert.equal(renders.length, 2);
});

test("a changed feed fingerprint invalidates cached HTML before the TTL", async () => {
  let version = "intel-1|news-a";
  const { renders, get } = harness({ fingerprint: () => version });
  await get("https://nexualpha.com/exchanges");
  assert.equal((await get("https://nexualpha.com/exchanges")).headers.get(SSR_CACHE_HEADER), "hit");
  version = "intel-2|news-a";
  const refreshed = await get("https://nexualpha.com/exchanges");
  assert.equal(refreshed.headers.get(SSR_CACHE_HEADER), "miss");
  assert.match(await refreshed.text(), /#2/);
  assert.equal(renders.length, 2);
});

test("the cache is bounded: the oldest entry is evicted past maxEntries", async () => {
  const { get, cache } = harness({ maxEntries: 2 });
  await get("https://nexualpha.com/exchanges?a=1");
  await get("https://nexualpha.com/exchanges?a=2");
  await get("https://nexualpha.com/exchanges?a=3");
  assert.equal(cache.stats().size, 2);
  assert.equal(cache.has("https://nexualpha.com/exchanges?a=1"), false);
  assert.equal(cache.has("https://nexualpha.com/exchanges?a=3"), true);
});

test("all public HTML routes cache, APIs, private routes and files bypass", () => {
  for (const path of ["/", "/zh-hans", "/news/a", "/zh-hans/flash/1", "/activities/updates/a", "/coins/btc", "/rates", "/compare/a"]) assert.ok(isPublicHtmlPath(path), path);
  for (const path of ["/api/live.json", "/assets/a.js", "/content/a.json", "/go/bitget", "/partners/private", "/__perf", "/healthz", "/robots.txt"]) assert.equal(isPublicHtmlPath(path), false, path);
});

test("irrelevant cookies share HTML; home hero variants and crawlers stay separate", async () => {
  const { get, renders } = harness();
  await get("https://nexualpha.com/rates", { cookie: "analytics=1; nx_hero=b" });
  assert.equal((await get("https://nexualpha.com/rates", { cookie: "analytics=2" })).headers.get(SSR_CACHE_HEADER), "hit");
  await get("https://nexualpha.com/zh-hans", { cookie: "nx_hero=a", "user-agent": "Mozilla/5.0" });
  await get("https://nexualpha.com/zh-hans", { cookie: "nx_hero=b", "user-agent": "Mozilla/5.0" });
  assert.equal(renders.length, 3);
  assert.equal((await get("https://nexualpha.com/zh-hans", { cookie: "other=1; nx_hero=b", "user-agent": "Mozilla/5.0" })).headers.get(SSR_CACHE_HEADER), "hit");
  assert.equal((await get("https://nexualpha.com/zh-hans", { cookie: "nx_hero=b", "user-agent": "Googlebot" })).headers.get(SSR_CACHE_HEADER), "miss");
});

test("Set-Cookie is never stored and byte budgets bound memory", async () => {
  const cache = createSsrPageCache({ maxBytes: 10 });
  const request = new Request("https://nexualpha.com/");
  await cache.fetch(request, async () => new Response("bucket", { headers: { "content-type": "text/html", "set-cookie": "nx_hero=b" } }));
  assert.equal(cache.stats().size, 0);
  await cache.fetch(request, async () => html("12345678901"));
  assert.equal(cache.stats().size, 0);
  await cache.fetch(new Request("https://nexualpha.com/news/a"), async () => html("123456"));
  await cache.fetch(new Request("https://nexualpha.com/news/b"), async () => html("123456"));
  assert.equal(cache.stats().size, 1);
  assert.equal(cache.stats().bytes, 6);
  cache.clear();
  assert.equal(cache.stats().bytes, 0);
});

test("no-store HTML is never retained", async () => {
  const cache = createSsrPageCache();
  await cache.fetch(new Request('https://nexualpha.com/funding-rates/matrix'), async () => new Response('live', { headers: { 'content-type': 'text/html', 'cache-control': 'no-store' } }));
  assert.equal(cache.stats().size, 0);
});
