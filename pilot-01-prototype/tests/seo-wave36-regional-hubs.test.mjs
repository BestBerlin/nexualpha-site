import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { routeMetadata } from "../worker/index.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { clampMetaDescription } from "../src/data/meta-description.js";
import { normalizeNewsFeed } from "../src/data/news-feed-client.js";
import { routeInventory } from "../scripts/generate-prerender-manifest.mjs";

function assets() {
  return { fetch: async () => new Response("missing", { status: 404, headers: { "content-type": "text/plain" } }) };
}

function graph(metadata) {
  const schema = metadata.schema?.["@graph"] || metadata.schema || [];
  return Array.isArray(schema) ? schema : [schema];
}

function schemaOf(schemas, type) {
  return schemas.find((schema) => schema?.["@type"] === type);
}

async function readJsonOrFixture(url, fallback) {
  try {
    return JSON.parse(await readFile(url, "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    return JSON.parse(await readFile(fallback, "utf8"));
  }
}

async function sourceInventory() {
  const feed = JSON.parse(await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8"));
  return { routes: routeInventory(normalizeNewsFeed(feed)) };
}

const cases = [
  { path: "/mx", locale: "es", market: "MX", title: /México|Investigación cripto/, canonical: "https://nexualpha.com/mx", source: /banxico\.org\.mx|binance\.com\/es-MX|gob\.mx\/cnbv/, faq: /SPEI|MXN|CNBV|producto/, related: "https://nexualpha.com/methodology" },
  { path: "/hk", locale: "zh-Hant", market: "HK", title: /香港加密平台帳戶核對|SFC|eDDA/, canonical: "https://nexualpha.com/hk", source: /sfc\.hk/, faq: /SFC|HKD|eDDA|地址證明|註冊歸因/, related: "https://nexualpha.com/methodology" },
  { path: "/eu", locale: "en", market: "EU", title: /Crypto Exchanges in the EU/, canonical: "https://nexualpha.com/eu", source: /esma\.europa\.eu/, faq: /MiCA|ESMA|SEPA|Member State/, related: "https://nexualpha.com/news/esma-mica-register-how-to-check-casp-issuer-status" },
  { path: "/uk", locale: "en", market: "UK", title: /Crypto Exchanges in the UK/, canonical: "https://nexualpha.com/uk", source: /fca\.org\.uk/, faq: /FCA|GBP|appropriateness|bank-name/, related: "https://nexualpha.com/methodology" },
  { path: "/jp?locale=ja", locale: "ja", market: "JP", title: /日本の暗号資産/, canonical: "https://nexualpha.com/jp", source: /fsa\.go\.jp|bitflyer\.com/, faq: /金融庁|本人名義口座|日本円入金/, related: "https://nexualpha.com/methodology" },
  { path: "/kr?locale=ko", locale: "ko", market: "KR", title: /한국 암호화폐/, canonical: "https://nexualpha.com/kr", source: /fsc\.go\.kr|kofiu\.go\.kr|upbit\.com/, faq: /금융위원회|실명확인 계좌|원화 입출금/, related: "https://nexualpha.com/methodology" },
  { path: "/tr/markets/turkiye", locale: "tr", market: "TR", title: /Türkiye kripto platformu/, canonical: "https://nexualpha.com/tr/markets/turkiye", source: /spk\.gov\.tr|paribu\.com/, faq: /SPK|TRY|tasfiye|ürün kapsamı/, related: "https://nexualpha.com/markets/turkiye" },
];

test("Wave36 regional hubs expose source-backed FAQ schema without changing canonical or index policy", async () => {
  for (const item of cases) {
    const client = computeRouteSeo({ url: item.path, locale: item.locale, route: { name: "regionalPreview", market: item.market } });
    const server = await routeMetadata(new URL(`https://nexualpha.com${item.path}`), { ASSETS: assets() });
    const clientPage = schemaOf(client.schemas, "WebPage");
    const serverPage = schemaOf(graph(server), "WebPage");
    const clientFaq = schemaOf(client.schemas, "FAQPage");
    const serverFaq = schemaOf(graph(server), "FAQPage");
    const joined = JSON.stringify([client.schemas, server.schema]);

    assert.equal(client.status, 200, item.path);
    assert.equal(server.status, 200, item.path);
    assert.equal(client.robots, "index,follow", item.path);
    assert.equal(server.robots, "index,follow", item.path);
    assert.equal(client.canonical, item.canonical, item.path);
    assert.equal(server.canonical, item.canonical, item.path);
    assert.equal(client.locale, item.locale, item.path);
    assert.equal(server.locale, item.locale, item.path);
    assert.match(client.title, item.title, item.path);
    assert.equal(client.title, server.title, item.path);
    // Class b: 5a2f9c3 keeps computeRouteSeo unclamped; served Worker metadata remains the clamp guarantee.
    assert.equal(clampMetaDescription(client.description, client.locale), server.description, item.path);
    assert.equal(clientPage.dateModified, "2026-09-15", item.path);
    assert.equal(serverPage.dateModified, "2026-09-15", item.path);
    assert.match(JSON.stringify(clientPage.isBasedOn), item.source, item.path);
    assert.match(JSON.stringify(serverPage.isBasedOn), item.source, item.path);
    assert.ok(clientPage.relatedLink.includes(item.related), item.path);
    assert.ok(serverPage.relatedLink.includes(item.related), item.path);
    assert.ok(clientFaq.mainEntity.length >= 2, item.path);
    if (serverFaq) assert.ok(serverFaq.mainEntity.length >= 2, item.path);
    assert.match(joined, item.faq, item.path);
    assert.match(joined, /https:\/\/nexualpha\.com\/methodology/, item.path);
    assert.doesNotMatch(joined, /nexu888|11350287|LUCKX|CANDY007|INS898|luckybitcoin|private commission|guaranteed registration|guaranteed approval|ranking improvement|traffic lift/i, item.path);
  }
});

test("Wave36 keeps unpublished regional previews out of the index", async () => {
  for (const path of ["/vn", "/int"]) {
    const metadata = await routeMetadata(new URL(`https://nexualpha.com${path}`), { ASSETS: assets() });
    assert.equal(metadata.status, 200, path);
    assert.equal(metadata.robots, "noindex,follow", path);
    assert.equal(metadata.alternates.length, 0, path);
  }
});

test("regional source inventory retains index policy and the historical consolidation fixture", async () => {
  const inventory = await sourceInventory();
  const duplication = await readJsonOrFixture(
    new URL("../../artifacts/seo/wave35-indexable-content-duplication.json", import.meta.url),
    new URL("./fixtures/seo/wave35-indexable-content-duplication.json", import.meta.url),
  );
  const regionalRows = Object.fromEntries(inventory.routes.filter((row) => ["/hk", "/eu", "/uk", "/jp", "/kr", "/markets/turkiye", "/mx", "/tw", "/id", "/vn", "/int"].includes(row.pathname)).map((row) => [row.pathname, row]));

  assert.equal(regionalRows["/hk"].index, true);
  assert.equal(regionalRows["/eu"].index, true);
  assert.equal(regionalRows["/uk"].index, true);
  assert.equal(regionalRows["/jp"].locales.join(","), "ja");
  assert.equal(regionalRows["/kr"].locales.join(","), "ko");
  assert.equal(regionalRows["/markets/turkiye"].locales.join(","), "tr");
  assert.equal(regionalRows["/mx"].index, true);
  assert.equal(regionalRows["/mx"].locales.join(","), "es");
  assert.equal(regionalRows["/tw"].index, true);
  assert.equal(regionalRows["/tw"].locales.join(","), "zh-Hant");
  assert.equal(regionalRows["/id"].index, true);
  assert.equal(regionalRows["/id"].locales.join(","), "id");
  assert.equal(regionalRows["/vn"].index, false);
  assert.equal(duplication.totals.duplicateTitleGroups, 0);
  assert.equal(duplication.totals.duplicateDescriptionGroups, 0);
  assert.equal(duplication.totals.duplicateH1Groups, 0);
  assert.equal(duplication.totals.duplicateMainFingerprintGroups, 0);
  assert.equal(duplication.totals.localeFallbackRiskGroups, 0);
  assert.equal(duplication.totals.thinPages, 0);
});
