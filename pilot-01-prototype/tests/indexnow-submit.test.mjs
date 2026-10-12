import assert from "node:assert/strict";
import test from "node:test";

import {
  buildIndexNowPayload,
  collectSitemapUrls,
  filterHttp200,
  isSitemapIndex,
  parseChangedUrls,
  parseSitemapUrls,
  selectIndexNowCandidates,
  submitIndexNowPayload,
} from "../scripts/indexnow-submit.mjs";

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://nexualpha.com/</loc></url>
  <url><loc>https://nexualpha.com/br</loc></url>
  <url><loc>https://nexualpha.com/news/source-backed-research?locale=zh-Hans</loc></url>
  <url><loc>https://evil.example/news</loc></url>
  <url><loc>not a url</loc></url>
</urlset>`;

test("sitemap parsing keeps only same-origin canonical locations", () => {
  assert.deepEqual(parseSitemapUrls(sitemap), [
    "https://nexualpha.com/",
    "https://nexualpha.com/br",
    "https://nexualpha.com/news/source-backed-research?locale=zh-Hans",
  ]);
});

test("a sitemap index is expanded into its children's page URLs, never the child sitemap URLs", async () => {
  const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://nexualpha.com/sitemap-venues.xml</loc></sitemap>
  <sitemap><loc>https://nexualpha.com/news-sitemap.xml</loc><lastmod>2026-10-12</lastmod></sitemap>
  <sitemap><loc>https://evil.example/sitemap.xml</loc></sitemap>
</sitemapindex>`;
  const children = {
    "https://nexualpha.com/sitemap-venues.xml": `<urlset><url><loc>https://nexualpha.com/venues/okx</loc></url><url><loc>https://nexualpha.com/</loc></url></urlset>`,
    "https://nexualpha.com/news-sitemap.xml": `<urlset><url><loc>https://nexualpha.com/news/a</loc></url><url><loc>https://nexualpha.com/</loc></url></urlset>`,
  };
  const loaded = [];
  assert.equal(isSitemapIndex(index), true);
  assert.equal(isSitemapIndex(sitemap), false);
  const urls = await collectSitemapUrls(index, { loadChild: async (url) => { loaded.push(url); return children[url]; } });
  assert.deepEqual(loaded, Object.keys(children));
  assert.deepEqual(urls, ["https://nexualpha.com/venues/okx", "https://nexualpha.com/", "https://nexualpha.com/news/a"]);
  assert.deepEqual(await collectSitemapUrls(sitemap, { loadChild: () => assert.fail("urlset has no children") }), parseSitemapUrls(sitemap));
});

test("changed URL file supports JSON and line formats", () => {
  assert.deepEqual(parseChangedUrls('{"urls":["https://nexualpha.com/br"]}'), ["https://nexualpha.com/br"]);
  assert.deepEqual(parseChangedUrls("https://nexualpha.com/\nhttps://nexualpha.com/br, /news/source-backed-research?locale=zh-Hans"), [
    "https://nexualpha.com/",
    "https://nexualpha.com/br",
    "/news/source-backed-research?locale=zh-Hans",
  ]);
});

test("candidate selection intersects changed URLs with sitemap canonicals", () => {
  const sitemapUrls = parseSitemapUrls(sitemap);
  const result = selectIndexNowCandidates({
    sitemapUrls,
    changedUrls: [
      "https://nexualpha.com/br#section",
      "/news/source-backed-research?locale=zh-Hans",
      "https://nexualpha.com/br?utm_source=tg",
      "https://example.com/offsite",
      "not a url",
    ],
    maxUrls: 10,
  });

  assert.deepEqual(result.urls, [
    "https://nexualpha.com/br",
    "https://nexualpha.com/news/source-backed-research?locale=zh-Hans",
  ]);
  assert.deepEqual(result.rejected.map((item) => item.reason), ["not-in-sitemap", "wrong-origin", "not-in-sitemap"]);
});

test("live filtering keeps only HTTP 200 candidates and falls back when HEAD is unavailable", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push([url, init.method]);
    if (url.endsWith("/head-405") && init.method === "HEAD") return new Response(null, { status: 405 });
    if (url.endsWith("/head-405") && init.method === "GET") return new Response("ok", { status: 200 });
    if (url.endsWith("/missing")) return new Response(null, { status: 404 });
    return new Response(null, { status: 200 });
  };

  const result = await filterHttp200([
    "https://nexualpha.com/br",
    "https://nexualpha.com/head-405",
    "https://nexualpha.com/missing",
  ], fetchImpl);

  assert.deepEqual(result.urls, ["https://nexualpha.com/br", "https://nexualpha.com/head-405"]);
  assert.deepEqual(result.rejected, [{ url: "https://nexualpha.com/missing", reason: "not-http-200" }]);
  assert.deepEqual(calls, [
    ["https://nexualpha.com/br", "HEAD"],
    ["https://nexualpha.com/head-405", "HEAD"],
    ["https://nexualpha.com/head-405", "GET"],
    ["https://nexualpha.com/missing", "HEAD"],
  ]);
});

test("payload uses host, key location and canonical URL list without logging invitation destinations", async () => {
  const payload = buildIndexNowPayload({
    origin: "https://nexualpha.com",
    key: "example-indexnow-key-123",
    keyLocation: "https://nexualpha.com/example-indexnow-key-123.txt",
    urls: ["https://nexualpha.com/br"],
  });
  const submitted = [];
  const result = await submitIndexNowPayload({
    endpoint: "https://api.indexnow.org/indexnow",
    payload,
    fetchImpl: async (url, init) => {
      submitted.push({ url, init });
      return new Response("", { status: 202 });
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 202);
  assert.equal(submitted[0].url, "https://api.indexnow.org/indexnow");
  assert.deepEqual(JSON.parse(submitted[0].init.body), payload);
  assert.doesNotMatch(submitted[0].init.body, /example\.com|partner-code|ref=/i);
});
