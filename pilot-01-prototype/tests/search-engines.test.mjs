import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { submissionWarning, submitYandexIndexNow, newestArticleUrls, submitFreshIndexNow } from "../scripts/search-engines.mjs";

test("Yandex network failures and Bing host throttling are warnings only", () => {
  for (const error of [new TypeError("fetch failed"), new DOMException("timeout", "TimeoutError"), Object.assign(new Error("network"), { cause: { code: "ETIMEDOUT" } })]) {
    assert.equal(submissionWarning("yandex", null, error), "unreachable");
  }
  assert.equal(submissionWarning("bing", { status: 400, text: "ThrottleHost" }), "throttled, retry next slot");
  assert.equal(submissionWarning("bing", { status: 400, text: "Invalid key" }), null);
  assert.equal(submissionWarning("yandex", null, new Error("missing credentials")), null);
});

test("Yandex IndexNow reuses the existing key and submits the supplied sitemap or changed URLs", async () => {
  const urls = ["https://nexualpha.com/about", "https://nexualpha.com/sitemap.xml"];
  let called = false;
  const result = await submitYandexIndexNow(urls, async (endpoint, init) => {
    called = true;
    assert.equal(endpoint, "https://yandex.com/indexnow");
    const payload = JSON.parse(init.body);
    assert.equal(payload.host, "nexualpha.com");
    assert.deepEqual(payload.urlList, urls);
    assert.match(payload.key, /^[A-Za-z0-9-]{8,128}$/);
    assert.ok(payload.keyLocation.startsWith("https://nexualpha.com/"));
    return new Response(null, { status: 202 });
  });
  assert.ok(called);
  assert.equal(result.ok, true);
});

test("Yandex API shares one 15 second deadline across both calls", async () => {
  const source = await readFile(new URL("../scripts/search-engines.mjs", import.meta.url), "utf8");
  assert.match(source, /AbortSignal.timeout\(15_000\)/);
  assert.match(source, /headers, signal/);
});

test("submit CLI exits zero on unreachable Yandex API, still calls IndexNow, and warns on Bing throttle", async () => {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { pathToFileURL, fileURLToPath } = await import("node:url");
  const { spawnSync } = await import("node:child_process");
  const dir = await mkdtemp(join(tmpdir(), "brand-submit-"));
  try {
    await writeFile(join(dir, "yandex-webmaster.env"), "YANDEX_OAUTH_TOKEN=test-only\n");
    await writeFile(join(dir, "bing-webmaster-api.env"), "BING_WEBMASTER_API_KEY=test-only\n");
    const mock = join(dir, "fetch.mjs");
    await writeFile(mock, `globalThis.fetch = async (url, init) => {
      url = String(url);
      if (url.includes("api.webmaster.yandex.net")) {
        if (!init.signal) throw new Error("missing timeout");
        throw new TypeError("fetch failed");
      }
      if (url.endsWith("/content/news-feed.json")) return Response.json({articles: []});
      if (url === "https://api.indexnow.org/indexnow") return new Response(null, {status:202});
      if (url === "https://yandex.com/indexnow") { console.log("MOCK_INDEXNOW_SUBMITTED"); return new Response(null, {status:202}); }
      if (url.includes("ssl.bing.com")) return new Response("ThrottleHost", {status:400});
      if (url.endsWith("sitemap.xml")) return new Response("<urlset><url></url></urlset>");
      throw new Error("Unexpected request");
    };`);
    const child = spawnSync(process.execPath, ["--import", pathToFileURL(mock).href, fileURLToPath(new URL("../scripts/search-engines.mjs", import.meta.url)), "submit"], {
      env: { ...process.env, NEXU_KEYS_DIR: dir }, encoding: "utf8", timeout: 10_000,
    });
    assert.equal(child.status, 0, child.stderr);
    assert.match(child.stdout, /WARN\s+unreachable/);
    assert.match(child.stdout, /throttled, retry next slot/);
    assert.match(child.stdout, /MOCK_INDEXNOW_SUBMITTED/);
    assert.match(child.stdout, /accepted by endpoint/);
  } finally { await rm(dir, {recursive:true, force:true}); }
});

test('fresh IndexNow repeats newest 50 indexable articles and batches at 100', async () => {
  const articles = Array.from({length: 65}, (_, i) => ({slug: `article-${i}`, title: {en: "News"}, summary: {en: "Summary"}, availableLocales: ["en"], publishedAt: new Date(Date.UTC(2026, 9, 1, i)).toISOString(), seo: {noindex: i === 64}, status: i === 63 ? 'DRAFT' : 'PUBLISHED'}));
  const fetchFeed = async () => Response.json({articles});
  const fresh = await newestArticleUrls(fetchFeed);
  assert.equal(fresh.length, 50);
  assert.equal(fresh[0], 'https://nexualpha.com/news/article-62');
  assert.deepEqual(await newestArticleUrls(fetchFeed), fresh);
  const batches = [];
  await submitFreshIndexNow([...fresh, ...fresh, ...Array.from({length: 180}, (_, i) => `https://nexualpha.com/news/extra-${i}`)], async (endpoint, init) => {
    assert.equal(endpoint, 'https://api.indexnow.org/indexnow');
    batches.push(JSON.parse(init.body).urlList);
    return new Response(null, {status:202});
  });
  assert.deepEqual(batches.map(b => b.length), [100,100,30]);
  assert.deepEqual(batches.flat().slice(0, 50), fresh);
});

test('fresh submission reads the public summary feed and excludes missing EN, future and search-state noindex rows', async () => {
  const { default: worker } = await import('../worker/index.js');
  const base = { status: 'PUBLISHED', category: 'research', title: { en: 'Research' }, summary: { en: 'Answer' }, content: { en: 'Native research body' }, availableLocales: ['en'], publishedAt: '2026-10-01T00:00:00Z', seo: { noindex: false } };
  const articles = [null, { ...base, slug: 'eligible' }, { ...base, slug: 'future', publishedAt: '2099-01-01T00:00:00Z' },
    { ...base, slug: 'thin', searchState: 'noindex-thin' }, { ...base, slug: 'unreviewed', seo: {} },
    { ...base, slug: 'chinese-only', availableLocales: ['zh-Hans'], title: { 'zh-Hans': '研究' }, summary: { 'zh-Hans': '摘要' }, content: { 'zh-Hans': '正文' } }];
  const response = await worker.fetch(new Request('https://nexualpha.com/content/news-feed.json'), { ASSETS: { fetch: async () => Response.json({ articles }) } });
  assert.equal(response.status, 200);
  assert.deepEqual(await newestArticleUrls(async () => response), ['https://nexualpha.com/news/eligible']);
});
