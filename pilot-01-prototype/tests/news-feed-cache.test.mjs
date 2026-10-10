// QA 2026-10-10 (Q6): runtime news SSR reuses the parsed feed while its sha is unchanged and serves a new feed at once.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sitesWorker from "../worker/index.js";

const article = (slug, title) => ({
  slug, status: "PUBLISHED", publishedAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z", author: "NexuAlpha Research Desk",
  title: { en: title }, summary: { en: `${title} summary.` }, content: { en: `${title} body.` },
  seo: { title, description: `${title} description.`, noindex: false }, sources: [{ url: "https://example.com/source" }],
});

function makeAssets() {
  const state = { feedText: "", sha: "", feedReads: 0 };
  state.publish = (articles) => { state.feedText = JSON.stringify({ articles }); state.sha = createHash("sha256").update(state.feedText).digest("hex"); };
  state.fetch = async (request) => {
    const p = new URL(request.url).pathname;
    if (p === "/index.html" || p === "/") return new Response("<!doctype html><html><head><title>Home</title></head><body><div id=\"root\"></div></body></html>", { headers: { "content-type": "text/html; charset=utf-8" } });
    if (p === "/content/news-feed.json") { state.feedReads += 1; return new Response(state.feedText, { headers: { "content-type": "application/json" } }); }
    if (p === "/content/news-feed.sha256.txt") return new Response(`${state.sha}\n`, { headers: { "content-type": "text/plain" } });
    return new Response("Not Found", { status: 404 });
  };
  return state;
}

const get = (assets, slug) => sitesWorker.fetch(new Request(`https://nexualpha.com/news/${slug}`, { headers: { accept: "text/html" } }), { ASSETS: assets });

test("an unchanged feed is parsed once; a published change is served on the next request", async () => {
  const assets = makeAssets();
  assets.publish([article("cache-first", "Cache First")]);
  const first = await get(assets, "cache-first");
  assert.equal(first.status, 200);
  assert.match(await first.text(), /Cache First/);
  const reads = assets.feedReads;
  for (let i = 0; i < 3; i += 1) assert.equal((await get(assets, "cache-first")).status, 200);
  assert.equal(assets.feedReads, reads, "same sha must not re-read the 23 MB feed");

  assets.publish([article("cache-first", "Cache First"), article("cache-second", "Cache Second")]);
  const second = await get(assets, "cache-second");
  assert.equal(second.status, 200);
  assert.match(await second.text(), /Cache Second/);
});

test("the sha file is the publish marker: a rewrite is served once its sha is published", async () => {
  const assets = makeAssets();
  assets.publish([article("race-old", "Race Old")]);
  await get(assets, "race-old");
  // the feed is rewritten first and its sha a moment later (live: ~13 ms apart)
  const staleSha = assets.sha;
  assets.publish([article("race-new", "Race New")]);
  const freshSha = assets.sha;
  assets.sha = staleSha;
  assert.equal((await get(assets, "race-old")).status, 200, "until the sha changes the previous feed stays consistent");
  assets.sha = freshSha;
  const res = await get(assets, "race-new");
  assert.equal(res.status, 200);
  assert.match(await res.text(), /Race New/);
});

test("without a sha file a changed feed text is served at once", async () => {
  const assets = makeAssets();
  const base = assets.fetch;
  assets.fetch = async (request) => (new URL(request.url).pathname === "/content/news-feed.sha256.txt" ? new Response("nf", { status: 404 }) : base(request));
  assets.publish([article("nosha-old", "No Sha Old")]);
  assert.equal((await get(assets, "nosha-old")).status, 200);
  assets.publish([article("nosha-new", "No Sha New")]);
  const res = await get(assets, "nosha-new");
  assert.equal(res.status, 200);
  assert.match(await res.text(), /No Sha New/);
});
