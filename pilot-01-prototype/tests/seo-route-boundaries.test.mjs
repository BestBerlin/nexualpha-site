import assert from "node:assert/strict";
import test from "node:test";
import worker, { routeMetadata } from "../worker/index.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";

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

function schemaArray(schema) {
  return Array.isArray(schema) ? schema : [schema].filter(Boolean);
}

function schemaOf(schema, type) {
  return schemaArray(schema).find((item) => item?.["@type"] === type);
}

test("topics and factbook collection hubs are self-canonical indexed collection pages", async () => {
  for (const [pathname, expectedTitle] of [
    ["/topics", "Topic"],
    ["/factbook", "Factbook"],
  ]) {
    const client = computeRouteSeo({ url: pathname });
    const server = await routeMetadata(new URL(`https://nexualpha.com${pathname}`), { ASSETS: assets() });

    assert.equal(client.status, 200, pathname);
    assert.equal(server.status, 200, pathname);
    assert.equal(client.robots, "index,follow", pathname);
    assert.equal(server.robots, "index,follow", pathname);
    assert.equal(client.canonical, `https://nexualpha.com${pathname}`, pathname);
    assert.equal(server.canonical, `https://nexualpha.com${pathname}`, pathname);
    assert.match(client.title, new RegExp(expectedTitle, "i"), pathname);
    assert.equal(schemaOf(client.schemas, "CollectionPage")?.url, client.canonical, pathname);
    assert.equal(schemaOf(server.schema, "CollectionPage")?.url, server.canonical, pathname);
    assert.ok(schemaOf(client.schemas, "ItemList")?.itemListElement?.length > 1, pathname);
    assert.ok(schemaOf(server.schema, "ItemList")?.itemListElement?.length > 1, pathname);
  }
});

test("collection hub locale publication stays English-only", async () => {
  for (const pathname of ["/zh-hans/topics", "/zh-hans/factbook"]) {
    const client = computeRouteSeo({ url: pathname });
    const server = await routeMetadata(new URL(`https://nexualpha.com${pathname}`), { ASSETS: assets() });
    const englishPath = pathname.replace("/zh-hans", "");

    assert.equal(client.status, 200, pathname);
    assert.equal(server.status, 200, pathname);
    assert.equal(client.robots, "noindex,follow", pathname);
    assert.equal(server.robots, "noindex,follow", pathname);
    assert.equal(client.canonical, `https://nexualpha.com${englishPath}`, pathname);
    assert.equal(server.canonical, `https://nexualpha.com${englishPath}`, pathname);
    assert.equal(schemaOf(client.schemas, "CollectionPage")?.url, client.canonical, pathname);
    assert.equal(schemaOf(server.schema, "CollectionPage")?.url, server.canonical, pathname);
  }
});

test("detail breadcrumbs point back to collection hubs", async () => {
  const topic = await routeMetadata(new URL("https://nexualpha.com/topics/no-kyc"), { ASSETS: assets() });
  const exchange = await routeMetadata(new URL("https://nexualpha.com/exchanges/binance"), { ASSETS: assets() });

  const topicBreadcrumb = schemaOf(topic.schema, "BreadcrumbList");
  const exchangeBreadcrumb = schemaOf(exchange.schema, "BreadcrumbList");

  assert.equal(topicBreadcrumb.itemListElement[1].item, "https://nexualpha.com/topics");
  assert.equal(exchangeBreadcrumb.itemListElement[0].item, "https://nexualpha.com/");
});

test("factbook detail URLs preserve indexed equity through exchange profile source-anchor redirects", async () => {
  const cases = [
    ["/factbook/htx", "https://nexualpha.com/exchanges/htx#sources"],
    ["/factbook/hashkey?locale=zh-Hans&utm_source=gsc", "https://nexualpha.com/zh-hans/exchanges/hashkey?utm_source=gsc#sources"],
    ["/ja/factbook/aevo", "https://nexualpha.com/ja/exchanges/aevo#sources"],
  ];

  for (const [source, destination] of cases) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${source}`, {
      headers: { accept: "text/html" },
    }), { ASSETS: assets() });

    assert.equal(response.status, 301, source);
    assert.equal(response.headers.get("location"), destination, source);
  }
});

test("legacy reverse comparison redirects to the curated comparison canonical", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/compare/kraken-vs-binance?locale=en&utm_source=gsc", {
    headers: { accept: "text/html" },
  }), { ASSETS: assets() });

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://nexualpha.com/compare/binance-vs-kraken?utm_source=gsc");
});

test("localized static routes emit self-canonicals and indexable metadata", async () => {
  for (const pathname of ["/zh-hans/rates", "/zh-hans/onchain", "/zh-hans/methodology", "/zh-hans/partners"]) {
    const url = `https://nexualpha.com${pathname}`;
    const response = await worker.fetch(new Request(url, { headers: { accept: "text/html" } }), { ASSETS: assets() });
    const html = await response.text();
    const canonicalPath = pathname.endsWith("/partners/embed-guide") ? "/zh-hans/partners" : pathname;
    assert.equal(response.status, 200, pathname);
    assert.match(html, new RegExp(`rel="canonical" href="https://nexualpha\\.com${canonicalPath.replaceAll("/", "\\/")}"`), pathname);
    assert.match(html, /name="robots" content="index,follow"/, pathname);
    assert.match(html, /NEXUALPHA_STATIC_ROUTE_V1/, pathname);
  }
});

test("Arabic path locale entrypoint is indexable, canonical and RTL", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/ar", { headers: { accept: "text/html" } }), { ASSETS: assets() });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /<html[^>]+lang="ar"[^>]+dir="rtl"/);
  assert.match(html, /<title[^>]*>رسوم منصات العملات الرقمية: OKX وBitget وBinance — NexuAlpha/);
  assert.match(html, /name="robots" content="index,follow"/);
  assert.match(html, /rel="canonical" href="https:\/\/nexualpha\.com\/ar"/);
  assert.match(html, /hreflang="ar"/);

  const redirected = await worker.fetch(new Request("https://nexualpha.com/?locale=ar&utm_source=legacy", { headers: { accept: "text/html" } }), { ASSETS: assets() });
  assert.equal(redirected.status, 308);
  assert.equal(redirected.headers.get("location"), "https://nexualpha.com/ar?utm_source=legacy");
});

test("unknown app routes are real 404 responses with noindex", async () => {
  const response = await worker.fetch(
    new Request("https://nexualpha.com/definitely-not-a-real-page?locale=zh-Hans", { headers: { accept: "text/html" } }),
    { ASSETS: assets() },
  );
  const html = await response.text();
  assert.equal(response.status, 404);
  assert.match(html, /name="robots" content="noindex,nofollow"/);
  assert.match(html, /NEXUALPHA_NOT_FOUND_ROUTE_V1/);
});

test("campaign and referral paths remain reachable but are excluded from indexing", async () => {
  for (const pathname of ["/activities/research/binance", "/ref/partner-code"]) {
    const response = await worker.fetch(
      new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }),
      { ASSETS: assets() },
    );
    const html = await response.text();
    assert.equal(response.status, 200, pathname);
    assert.match(html, /name="robots" content="noindex,follow"/, pathname);
  }
});

test("regional SEO metadata stays localized in the Worker route", async () => {
  const cases = [
    ["/eu", "ja", "EU暗号資産プラットフォームの口座条件調査"],
    ["/uk", "es", "Investigación de cuentas cripto en Reino Unido"],
    ["/hk", "de", "Krypto-Kontobedingungen in Hongkong"],
  ];
  for (const [pathname, locale, expectedTitle] of cases) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}?locale=${locale}`, { headers: { accept: "text/html" } }), { ASSETS: assets() });
    const html = await response.text();
    assert.equal(response.status, 200, `${pathname}/${locale}`);
    assert.match(html, new RegExp(`<title[^>]*>${expectedTitle}`), `${pathname}/${locale}`);
    assert.match(html, new RegExp(`name="description" content="[^"]+"`), `${pathname}/${locale}`);
  }
});

test("Japan regional route is indexable with a Japanese FAQ schema", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/jp?locale=ja", { headers: { accept: "text/html" } }), { ASSETS: assets() });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /name="robots" content="index,follow"/);
  assert.match(html, /rel="canonical" href="https:\/\/nexualpha\.com\/jp"/);
  assert.match(html, /日本で暗号資産プラットフォームを選ぶ前に何を確認すべきですか/);
  assert.match(html, /hreflang="ja"/);
  assert.doesNotMatch(html, /\/jp\?locale=ko/);
});

test("Singapore regional route is indexable with source-backed FAQ schema", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/sg", { headers: { accept: "text/html" } }), { ASSETS: assets() });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /name="robots" content="index,follow"/);
  assert.match(html, /rel="canonical" href="https:\/\/nexualpha\.com\/sg"/);
  assert.match(html, /Singapore crypto account checks: MAS DPT, SGD, PayNow and FAST/);
  assert.match(html, /"@type":"FAQPage"/);
  assert.match(html, /MAS Digital Payment Token/);
  assert.match(html, /hreflang="en"/);
});

test("Hong Kong regional route is indexable with Traditional Chinese source-backed metadata", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/hk", { headers: { accept: "text/html" } }), { ASSETS: assets() });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /name="robots" content="index,follow"/);
  assert.match(html, /rel="canonical" href="https:\/\/nexualpha\.com\/hk"/);
  assert.match(html, /香港加密平台帳戶核對：SFC、HKD、eDDA 與產品範圍/);
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /sfc\.hk/);
  assert.match(html, /HKD 銀行轉帳/);
  assert.match(html, /hreflang="zh-Hant"/);

  const english = await worker.fetch(new Request("https://nexualpha.com/hk?locale=en", { headers: { accept: "text/html" } }), { ASSETS: assets() });
  const englishHtml = await english.text();
  assert.equal(english.status, 200);
  assert.match(englishHtml, /name="robots" content="noindex,follow"/);
  assert.doesNotMatch(englishHtml, /hreflang="zh-Hant"/);
});

test("Türkiye regional route is indexable with Turkish SPK FAQ schema", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/tr/markets/turkiye", { headers: { accept: "text/html" } }), { ASSETS: assets() });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /name="robots" content="index,follow"/);
  assert.match(html, /rel="canonical" href="https:\/\/nexualpha\.com\/tr\/markets\/turkiye"/);
  assert.match(html, /Türkiye kripto platformu araştırması/);
  assert.match(html, /"@type":"FAQPage"/);
  assert.match(html, /SPK/);
  assert.match(html, /hreflang="tr"/);
});

test("Türkiye regional route keeps non-Turkish entrypoints out of the index", async () => {
  const redirect = await worker.fetch(new Request("https://nexualpha.com/markets/turkiye?locale=en", { headers: { accept: "text/html" } }), { ASSETS: assets() });
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get("location"), "https://nexualpha.com/markets/turkiye");

  const response = await worker.fetch(new Request("https://nexualpha.com/markets/turkiye", { headers: { accept: "text/html" } }), { ASSETS: assets() });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /name="robots" content="noindex,follow"/);
  assert.match(html, /rel="canonical" href="https:\/\/nexualpha\.com\/markets\/turkiye"/);
  assert.doesNotMatch(html, /hreflang="tr"/);
});
