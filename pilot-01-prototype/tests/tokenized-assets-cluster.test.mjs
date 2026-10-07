import assert from "node:assert/strict";
import test from "node:test";
import {
  TOKENIZED_ASSET_LOCALES,
  TOKENIZED_ASSET_PAGES,
  TOKENIZED_ASSET_SOURCE_URLS,
  tokenizedAssetSources,
} from "../src/data/tokenized-assets-cluster.js";
import { routeInventory } from "../scripts/generate-prerender-manifest.mjs";
import worker from "../worker/index.js";

const shell = "<!doctype html><html lang=\"en\"><head><title>NexuAlpha</title><meta name=\"description\" content=\"base\"><meta name=\"robots\" content=\"index,follow\"></head><body><main>app</main></body></html>";

function assets() {
  return {
    fetch: async (request) => {
      const url = new URL(request.url);
      return url.pathname === "/index.html"
        ? new Response(shell, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } })
        : new Response("missing", { status: 404, headers: { "content-type": "text/plain" } });
    },
  };
}

async function page(path) {
  const response = await worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html" } }), { ASSETS: assets() });
  return { status: response.status, html: await response.text() };
}

test("tokenized asset cluster is source-bound and only opens English plus Simplified Chinese", () => {
  assert.deepEqual(TOKENIZED_ASSET_LOCALES, ["en", "zh-Hans"]);
  assert.equal(Object.keys(TOKENIZED_ASSET_PAGES).length, 3);

  for (const page of Object.values(TOKENIZED_ASSET_PAGES)) {
    assert.match(page.path, /^\/topics\/tokenized-/);
    assert.ok(page.directAnswer.en.length > 120, page.slug);
    assert.ok(page.directAnswer["zh-Hans"].length > 40, page.slug);
    assert.ok(page.decisionRows.length >= 3, page.slug);
    assert.ok(page.faqs.length >= 2, page.slug);
    assert.ok(tokenizedAssetSources(page).length >= 3, page.slug);
    assert.ok(tokenizedAssetSources(page).every((source) => TOKENIZED_ASSET_SOURCE_URLS[source.id] || source.url.startsWith("https://")), page.slug);
  }
  assert.match(TOKENIZED_ASSET_PAGES["tokenized-treasuries"].directAnswer.en, /Treasury-linked fund shares, notes or recordkeeping tokens represented on-chain/);
  assert.match(TOKENIZED_ASSET_PAGES["tokenized-treasuries"].directAnswer.en, /not automatically the same as directly holding Treasury bills/);
});

test("tokenized asset routes are prerendered and indexed only for en and zh-Hans", () => {
  const inventory = routeInventory();

  for (const page of Object.values(TOKENIZED_ASSET_PAGES)) {
    const route = inventory.find((item) => item.pathname === page.path);
    assert.ok(route, page.path);
    assert.equal(route.index, true, page.path);
    assert.deepEqual(route.locales, ["en", "zh-Hans"], page.path);
    assert.equal(route.template, "topic", page.path);
  }
});

test("worker emits tokenized asset SEO boundaries and AEO schema", async () => {
  const en = await page("/topics/tokenized-assets");
  assert.equal(en.status, 200);
  assert.match(en.html, /Tokenized Assets Hub: Treasury, Stock and Perp Exposure Checks|Tokenized Assets Research Hub/);
  assert.match(en.html, /name="robots" content="index,follow"/);
  assert.match(en.html, /rel="canonical" href="https:\/\/nexualpha\.com\/topics\/tokenized-assets"/);
  assert.match(en.html, /hreflang="en"/);
  assert.match(en.html, /hreflang="zh-Hans"/);
  assert.match(en.html, /"@type":"FAQPage"/);
  assert.match(en.html, /securitize\.io/);
  assert.doesNotMatch(en.html, /nexu888|11350287|MOCK_EVENTS/i);

  const zh = await page("/zh-hans/topics/tokenized-treasuries");
  assert.equal(zh.status, 200);
  assert.match(zh.html, /代币化美债核对清单/);
  assert.match(zh.html, /name="robots" content="index,follow"/);
  assert.match(zh.html, /rel="canonical" href="https:\/\/nexualpha\.com\/zh-hans\/topics\/tokenized-treasuries"/);

  const unsupported = await page("/fr/topics/tokenized-assets");
  assert.equal(unsupported.status, 200);
  assert.match(unsupported.html, /name="robots" content="noindex,follow"/);
  assert.match(unsupported.html, /rel="canonical" href="https:\/\/nexualpha\.com\/topics\/tokenized-assets"/);
  assert.doesNotMatch(unsupported.html, /hreflang="fr"/);
});
