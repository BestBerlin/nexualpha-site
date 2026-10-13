import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  AUDIT_DATE,
  FACTBOOK_REGISTRY,
  FACTBOOK_SLUGS,
  generateLlmMarkdown,
} from "../src/data/factbook-registry.js";
import { buildFactbookSchemas } from "../src/data/seo-injection.js";
import { exchangeKeyFacts } from "../src/data/exchange-key-facts.js";
import { factbookDates } from "../src/data/factbook-dates.js";
import sitesWorker from "../worker/index.js";
import { buildSplitSitemaps, routeInventory } from "../scripts/generate-prerender-manifest.mjs";
import { loadSearchPublicationBaseline } from "../scripts/sitemap-publication-policy.mjs";

const EXPECTED_VENUES = [
  "binance",
  "okx",
  "bybit",
  "bitget",
  "coinbase",
  "kraken",
  "gate-io",
  "kucoin",
  "mexc",
  "htx",
  "backpack",
  "deribit",
  "hashkey",
  "hyperliquid",
  "dydx",
  "gmx",
  "drift",
  "aevo",
  "uniswap",
  "pancakeswap",
  "jupiter",
  "raydium",
  "aerodrome",
  "curve",
];

test("factbook-registry contains all 25 venues with complete GEO facts and 10 VIP tiers", () => {
  assert.equal(AUDIT_DATE, "2026-09-08");
  assert.equal(FACTBOOK_SLUGS.length, 25); // 24 + CoinW (2026-10-13)

  for (const slug of EXPECTED_VENUES) {
    const venue = FACTBOOK_REGISTRY[slug];
    assert.ok(venue, `Missing factbook entry for slug: ${slug}`);
    assert.equal(venue.slug, slug);
    assert.ok(venue.name);
    assert.ok(venue.category);
    assert.ok(venue.auditHash);
    assert.ok(venue.por);
    assert.ok(venue.compliance);
    assert.ok(venue.apiEndpoints);

    // CEX fee schedule check: 10 tiers
    if (venue.category === "CEX") {
      assert.equal(venue.vipTiers.length, 10, `${slug} must have exactly 10 VIP/volume tiers`);
      assert.ok(venue.vipTiers[0].tier);
      assert.ok(venue.vipTiers[9].tier);
      assert.ok(venue.por.cleanRatio);
    }

    // Markdown generator check
    const md = generateLlmMarkdown(venue);
    assert.ok(md.includes(venue.name));
    assert.ok(md.includes(venue.auditHash));
    assert.ok(md.includes("Source Review Factbook"));
  }
});

test("exchange key facts merge dated factbook PoR and KYC fields after factbook detail redirects", () => {
  const rows = Object.fromEntries(exchangeKeyFacts("binance").rows.map((row) => [row.id, row]));
  assert.match(rows["proof-of-reserves"].value.scope, /clean reserve ratio 103\.4%/);
  assert.match(rows["proof-of-reserves"].value.scope, /SAFU/);
  assert.match(rows["kyc-reference"].value, /Mandatory Level 1\/2 KYC/);
  assert.match(rows["kyc-reference"].value, /restricted regions: United States/);
});

test("Factbook refreshes source-bound public fields when the locale changes", async () => {
  const source = await readFile(new URL("../src/components/v3/FactbookPage.jsx", import.meta.url), "utf8");
  assert.match(source, /publicFactbookVenue\(FACTBOOK_REGISTRY\[slug\].*\[slug, locale\]/s);
  assert.match(source, /if \(filterCategory === "ALL"\).*\[filterCategory, locale\]/s);
});

test("Factbook keeps HTX partner route visible without claiming unverified user benefits", async () => {
  const htx = FACTBOOK_REGISTRY.htx;
  assert.equal(htx.rebate.code, "nexu888");
  assert.equal(htx.rebate.url, "https://www.htx.com/invite/en-us/1h?invite_code=nexu888");

  const source = await readFile(new URL("../src/components/v3/FactbookPage.jsx", import.meta.url), "utf8");
  assert.match(source, /benefitVerified: offerVerified/);
  assert.match(source, /publicCtaForVenue\(venue\.slug, locale, market\)/);
  assert.match(source, /href=\{activationCta\.registrationUrl\}/);
  assert.match(source, /User benefit status/);
  assert.match(source, /Open partner signup route/);
  assert.doesNotMatch(source, /venue\.rebate\?\.percent > 0 && \(/);
});

test("Factbook decision links hand off to exchange profile source sections", async () => {
  const source = await readFile(new URL("../src/components/v3/FactbookPage.jsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /factbookOnlyDecisionSlugs/);
  assert.match(source, /localizedHref\(`\/exchanges\/\$\{encodeURIComponent\(venue\.slug\)\}#sources`/);
  assert.match(source, /localizedHref\(`\/exchanges\/\$\{encodeURIComponent\(s\)\}#sources`/);
});

test("seo-injection Factbook schema describes the dataset without inventing FAQ claims", () => {
  const binance = FACTBOOK_REGISTRY.binance;
  const schemas = buildFactbookSchemas(binance, "en");
  assert.equal(schemas.length, 2);

  const dataset = schemas.find((s) => s["@type"] === "Dataset");
  assert.ok(dataset);
  assert.ok(dataset.name.includes("Binance"));
  assert.ok(dataset.variableMeasured.length >= 5);
  assert.match(dataset.dateModified, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(
    dataset.dateModified >= AUDIT_DATE,
    `Dataset modification date ${dataset.dateModified} cannot predate the ${AUDIT_DATE} source audit`,
  );
  assert.equal(dataset.about["@type"], "Organization");
  assert.equal(dataset.about.name, "Binance");
  assert.equal(dataset.isBasedOn, "https://www.binance.com");

  assert.equal(schemas.some((schema) => schema["@type"] === "FAQPage"), false);

  const breadcrumbs = schemas.find((s) => s["@type"] === "BreadcrumbList");
  assert.ok(breadcrumbs);
  assert.equal(breadcrumbs.itemListElement.length, 3);
});

test("public llms files expose a comprehensive, source-bounded AI knowledge graph", async () => {
  const llmsTxt = await readFile(new URL("../public/llms.txt", import.meta.url), "utf-8");
  assert.match(llmsTxt, /\[ja homepage\]\(https:\/\/nexualpha\.com\/ja\)/);
  assert.doesNotMatch(llmsTxt, /\[ja homepage\]\(https:\/\/nexualpha\.com\/\?locale=ja\)/);
  assert.ok(llmsTxt.includes("NexuAlpha"));
  assert.ok(llmsTxt.includes("/llms-full.txt"));
  assert.ok(llmsTxt.includes("https://nexualpha.com/exchanges"));
  assert.ok(llmsTxt.includes("https://nexualpha.com/compare/binance-vs-okx"));
  assert.doesNotMatch(llmsTxt, /https:\/\/nexualpha\.com\/(?:directory|compare)(?:\s|\)|$)/);
  for (const slug of EXPECTED_VENUES) {
    assert.ok(llmsTxt.includes(`/exchanges/${slug}`), `llms.txt missing exchange profile link for ${slug}`);
    assert.equal(llmsTxt.includes(`/factbook/${slug}`), false, `llms.txt should not publish redirected factbook link for ${slug}`);
  }

  const llmsFull = await readFile(new URL("../public/llms-full.txt", import.meta.url), "utf-8");
  assert.ok(llmsFull.length > 50000, `llms-full.txt should be comprehensive (>50KB), got ${llmsFull.length}`);
  // H1 is the brand since the SEO audit 2026-10-11 #9 (was "NexuAlpha public source review index").
  assert.ok(llmsFull.startsWith("# NexuAlpha"));
  assert.ok(llmsFull.includes("2026-09-08"));
  assert.ok(llmsFull.includes("Hong Kong SFC"));
  assert.ok(llmsFull.includes("European Securities and Markets Authority"));
  assert.ok(llmsFull.includes("UK Financial Conduct Authority"));
  assert.ok(llmsFull.includes("https://nexualpha.com/exchanges"));
  assert.ok(llmsFull.includes("https://nexualpha.com/compare/binance-vs-okx"));
  assert.doesNotMatch(llmsFull, /https:\/\/nexualpha\.com\/(?:directory|compare)(?:\s|\)|$)/);
  for (const unsafeClaim of [
    "Comprehensive Ground Truth Knowledge Graph",
    "NexuAlpha Net Rates",
    "Fact Density = 1.0",
    "Anti-Freeze Rating",
    "Referral Activation Code",
    "lifetime net fee rebate",
    "100% confidence",
    "real-time fee",
  ]) {
    assert.equal(llmsFull.toLowerCase().includes(unsafeClaim.toLowerCase()), false, `unsafe claim leaked: ${unsafeClaim}`);
  }
  for (const slug of EXPECTED_VENUES) {
    assert.ok(llmsFull.includes(`[${slug.toUpperCase()}]`) || llmsFull.includes(`### 1.${EXPECTED_VENUES.indexOf(slug) + 1}`) || llmsFull.includes(`https://nexualpha.com/exchanges/${slug}`));
    assert.equal(llmsFull.includes(`https://nexualpha.com/factbook/${slug}`), false, `llms-full should not publish redirected factbook link for ${slug}`);
  }
});

test("split sitemap children publish exchange profiles, not redirected factbook detail URLs", async () => {
  const split = buildSplitSitemaps(routeInventory([]), [], { policy: loadSearchPublicationBaseline() });
  const sitemap = split.files.get("sitemap-venues.xml")?.xml || "";
  for (const slug of EXPECTED_VENUES) {
    assert.equal(sitemap.includes(`<loc>https://nexualpha.com/factbook/${slug}</loc>`), false, `sitemap should not publish redirected factbook URL for ${slug}`);
    assert.equal(sitemap.includes(`<loc>https://nexualpha.com/factbook/${slug}?locale=zh-Hans</loc>`), false, `sitemap should not publish query-locale factbook duplicate for ${slug}`);
  }
  for (const slug of ["binance", "okx"]) {
    assert.ok(sitemap.includes(`<loc>https://nexualpha.com/exchanges/${slug}</loc>`), `sitemap missing exchange profile for ${slug}`);
  }
});

test("worker redirects factbook detail routes to exchange source anchors and keeps the hub indexable", async () => {
  const assets = {
    fetch: async (request) => {
      const url = new URL(request.url);
      if (url.pathname === "/index.html") {
        return new Response(
          `<!doctype html><html><head><title>NexuAlpha</title></head><body><div id="root"></div></body></html>`,
          { headers: { "content-type": "text/html; charset=utf-8" } },
        );
      }
      return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain" } });
    },
  };

  // 1. English Factbook detail redirects into the merged exchange profile source section.
  const resEn = await sitesWorker.fetch(
    new Request("https://nexualpha.com/factbook/binance", { headers: { accept: "text/html" } }),
    { ASSETS: assets },
  );
  assert.equal(resEn.status, 301);
  assert.equal(resEn.headers.get("location"), "https://nexualpha.com/exchanges/binance#sources");

  // 2. Localized Factbook detail redirects to the localized exchange profile and preserves useful context.
  const resZh = await sitesWorker.fetch(
    new Request("https://nexualpha.com/zh-hans/factbook/okx?market=HK&utm_source=drop", { headers: { accept: "text/html" } }),
    { ASSETS: assets },
  );
  assert.equal(resZh.status, 301);
  assert.equal(resZh.headers.get("location"), "https://nexualpha.com/zh-hans/exchanges/okx?market=HK&utm_source=drop#sources");

  // 3. Root /factbook is its own collection hub, not a Binance detail alias.
  const resRoot = await sitesWorker.fetch(
    new Request("https://nexualpha.com/factbook", { headers: { accept: "text/html" } }),
    { ASSETS: assets },
  );
  assert.equal(resRoot.status, 200);
  const htmlRoot = await resRoot.text();
  assert.match(htmlRoot, /Source Review Factbook — NexuAlpha/);
  assert.match(htmlRoot, /"@type":"CollectionPage"/);
  assert.match(htmlRoot, /rel="canonical" href="https:\/\/nexualpha\.com\/factbook"/);
  assert.doesNotMatch(htmlRoot, /Binance Source Review Factbook/);

  // 4. Invalid slug stays 404 with noindex instead of redirecting to an unrelated exchange.
  const resInvalid = await sitesWorker.fetch(
    new Request("https://nexualpha.com/factbook/unknown-exchange", { headers: { accept: "text/html" } }),
    { ASSETS: assets },
  );
  assert.equal(resInvalid.status, 404);
  const htmlInvalid = await resInvalid.text();
  assert.match(htmlInvalid, /name="robots" content="noindex,nofollow"/);
});
