// Compare-any (2026-10-11): every pair of active venues gets a data-only /compare/<a>-vs-<b> page. Route resolution in
// all 17 locales, reverse-slug 301, the index policy matrix, locale-sitemap counts, GET-form normalization, runtime SSR
// injection, and the rendered page (one H1, both partner CTAs beside the disclosure, no CTA for a non-partner pair).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import worker, { renderLocaleSitemap, routeMetadata } from "../worker/index.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { budgetTitle } from "../src/data/meta-description.js";
import {
  ACTIVE_COMPARE_VENUE_SLUGS, COMPARE_LOCALES, CURATED_COMPARISON_SLUGS, canonicalComparePairSlug, generatedCompareCopy,
  generatedCompareLocales, generatedComparePairs, generatedComparePolicy, indexableGeneratedComparePairs, comparePickerCopy, compareIndexCopy,
} from "../src/data/compare-generated.js";
import { comparePathFor } from "../src/components/v6/compare-routes.js";
import { localizedPath } from "../src/data/locale-routing.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const shell = "<!doctype html><html><head><title>x</title></head><body><div id=\"root\"></div></body></html>";
const assets = () => ({
  fetch: async (request) => new URL(request.url).pathname === "/index.html"
    ? new Response(shell, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } })
    : new Response("missing", { status: 404, headers: { "content-type": "text/plain" } }),
});
const html = (url, env = {}) => worker.fetch(new Request(url, { headers: { accept: "text/html" } }), { ASSETS: assets(), ...env });
const count = (source, pattern) => (source.match(pattern) || []).length;
const unescape = (markup) => markup.replace(/&#x27;/g, "'").replace(/&quot;/g, "\"").replace(/&amp;/g, "&");

const INDEXABLE_PAIR = "gate-io-vs-kraken"; // both reviewed fee rows, both partners
const NOINDEX_PAIR = "dydx-vs-kucoin"; // both reviewed, no partner route
const NOINDEX_UNREVIEWED = "coinbase-vs-okx"; // partner, but Coinbase has no reviewed fee row

test("canonical slug: curated order wins, otherwise alphabetical; three-venue selections untouched", () => {
  assert.equal(canonicalComparePairSlug(["okx", "bitget"]), "bitget-vs-okx");
  assert.equal(canonicalComparePairSlug(["dydx", "hyperliquid"]), "hyperliquid-vs-dydx");
  assert.equal(canonicalComparePairSlug(["kraken", "gate-io"]), "gate-io-vs-kraken");
  assert.equal(canonicalComparePairSlug(["okx", "binance", "bybit"]), "okx-vs-binance-vs-bybit");
  assert.equal(comparePathFor(["kraken", "gate-io"]).path, "/compare/gate-io-vs-kraken");
  for (const pair of CURATED_COMPARISON_SLUGS) assert.equal(canonicalComparePairSlug(pair.split("-vs-")), pair);
});

test("a generated pair resolves in all 17 locales with templated copy and the shared index policy", async () => {
  for (const locale of COMPARE_LOCALES) {
    const url = `https://nexualpha.com${localizedPath(`/compare/${INDEXABLE_PAIR}`, locale)}`;
    const meta = await routeMetadata(new URL(url), {});
    const copy = generatedCompareCopy(locale, { nameA: "Gate.io", nameB: "Kraken", date: "2026-10-10" });
    assert.equal(meta.status, 200, url);
    assert.equal(meta.canonical, url, url);
    // Owner title-budget rule: long served titles drop the trailing brand suffix, while source copy keeps it.
    assert.equal(meta.title, budgetTitle(copy.title), url);
    assert.ok(meta.description.length > 40 && meta.description.length <= 160 + 20, url);
    const expected = generatedCompareLocales(INDEXABLE_PAIR).includes(locale) ? "index,follow" : "noindex,follow";
    assert.equal(meta.robots, expected, url);
    assert.equal(computeRouteSeo({ pathname: `/compare/${INDEXABLE_PAIR}`, locale, route: {} }).robots, expected, `seo-injection mirror ${locale}`);
    if (expected === "index,follow") assert.ok(meta.alternates.some((alt) => alt.hreflang === "x-default"), url);
    else assert.deepEqual(meta.alternates, [], url);
  }
  assert.deepEqual(generatedCompareLocales(INDEXABLE_PAIR), ["en", "zh-Hans", "zh-Hant"]);
});

test("the reverse slug 301s to the canonical pair and keeps attribution params", async () => {
  const response = await html("https://nexualpha.com/compare/kraken-vs-gate-io?utm_source=gsc&market=TR");
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://nexualpha.com/compare/gate-io-vs-kraken?utm_source=gsc&market=TR");
  const localized = await html("https://nexualpha.com/tr/compare/kraken-vs-gate-io");
  assert.equal(localized.status, 301);
  assert.equal(localized.headers.get("location"), "https://nexualpha.com/tr/compare/gate-io-vs-kraken");
  // Curated pairs keep their editorial order as canonical.
  const curated = await html("https://nexualpha.com/compare/bybit-vs-okx");
  assert.equal(curated.status, 301);
  assert.equal(curated.headers.get("location"), "https://nexualpha.com/compare/okx-vs-bybit");
  const canonical = await html(`https://nexualpha.com/compare/${INDEXABLE_PAIR}`);
  assert.equal(canonical.status, 200);
});

test("index policy matrix: both reviewed AND at least one partner -> index; otherwise noindex,follow", () => {
  const fixtures = { hasReviewedFees: (slug) => ["alpha", "beta", "gamma"].includes(slug), isPartner: (slug) => ["alpha", "delta"].includes(slug) };
  assert.equal(generatedComparePolicy("alpha-vs-beta", fixtures).robots, "index,follow"); // reviewed + reviewed, one partner
  assert.equal(generatedComparePolicy("beta-vs-gamma", fixtures).robots, "noindex,follow"); // reviewed, no partner
  assert.equal(generatedComparePolicy("alpha-vs-delta", fixtures).robots, "noindex,follow"); // partner, delta unreviewed
  assert.equal(generatedComparePolicy("delta-vs-epsilon", fixtures).robots, "noindex,follow"); // nothing
  assert.equal(generatedComparePolicy("binance-vs-okx").curated, true);
  assert.equal(generatedComparePolicy("binance-vs-okx").robots, "index,follow");
  assert.equal(generatedComparePolicy(NOINDEX_PAIR).robots, "noindex,follow");
  assert.equal(generatedComparePolicy(NOINDEX_UNREVIEWED).robots, "noindex,follow");
  assert.equal(generatedComparePolicy(INDEXABLE_PAIR).robots, "index,follow");
  const indexable = indexableGeneratedComparePairs();
  assert.ok(indexable.length >= 20 && indexable.length <= 60, `indexable generated pairs: ${indexable.length}`);
  assert.ok(indexable.every((pair) => !CURATED_COMPARISON_SLUGS.includes(pair)));
  const expectedTotal = (ACTIVE_COMPARE_VENUE_SLUGS.length * (ACTIVE_COMPARE_VENUE_SLUGS.length - 1)) / 2 - CURATED_COMPARISON_SLUGS.length;
  assert.equal(generatedComparePairs().length, expectedTotal);
  console.log(`[compare-any] indexable generated pairs: ${indexable.length} of ${expectedTotal}`);
});

test("noindex pairs still render (200) and never carry hreflang alternates", async () => {
  for (const pair of [NOINDEX_PAIR, NOINDEX_UNREVIEWED]) {
    const meta = await routeMetadata(new URL(`https://nexualpha.com/compare/${pair}`), {});
    assert.equal(meta.status, 200, pair);
    assert.equal(meta.robots, "noindex,follow", pair);
    assert.deepEqual(meta.alternates, [], pair);
    const response = await html(`https://nexualpha.com/compare/${pair}`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /name="robots" content="noindex,follow"/);
  }
});

test("the locale sitemap lists only indexable generated pairs, en plus the locales with localized facts", async () => {
  const xml = await renderLocaleSitemap({});
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const generated = new Set(generatedComparePairs());
  const listed = locs.filter((loc) => generated.has(loc.split("/compare/")[1]));
  const indexable = indexableGeneratedComparePairs();
  const expected = indexable.reduce((sum, pair) => sum + generatedCompareLocales(pair).length, 0);
  assert.equal(listed.length, expected, `generated pair URLs in sitemap: ${listed.length}`);
  for (const pair of indexable) {
    assert.ok(locs.includes(`https://nexualpha.com/compare/${pair}`), pair);
    assert.ok(locs.includes(`https://nexualpha.com/zh-hans/compare/${pair}`), `${pair} zh-Hans`);
    assert.ok(!locs.includes(`https://nexualpha.com/tr/compare/${pair}`), `${pair} tr must stay out`);
  }
  assert.ok(!locs.some((loc) => loc.endsWith(`/compare/${NOINDEX_PAIR}`)));
  assert.ok(locs.includes("https://nexualpha.com/compare") && locs.includes("https://nexualpha.com/de/compare"), "compare hub listed");
  console.log(`[compare-any] generated pair URLs in locale sitemap: ${listed.length}`);
});

test("GET /compare?a=&b= normalizes to the canonical pair (302) and invalid picks return to the hub", async () => {
  const cases = [
    ["https://nexualpha.com/compare?a=okx&b=bitget", "https://nexualpha.com/compare/bitget-vs-okx"],
    ["https://nexualpha.com/tr/compare?a=kraken&b=binance", "https://nexualpha.com/tr/compare/binance-vs-kraken"],
    ["https://nexualpha.com/compare?a=kraken&b=gate-io&market=TR", "https://nexualpha.com/compare/gate-io-vs-kraken?market=TR"],
    ["https://nexualpha.com/compare?a=okx&b=okx", "https://nexualpha.com/compare"],
    ["https://nexualpha.com/compare?a=okx&b=notavenue", "https://nexualpha.com/compare"],
    ["https://nexualpha.com/compare?a=okx", "https://nexualpha.com/compare"],
  ];
  for (const [source, destination] of cases) {
    const response = await html(source);
    assert.equal(response.status, 302, source);
    assert.equal(response.headers.get("location"), destination, source);
  }
  const hub = await routeMetadata(new URL("https://nexualpha.com/compare"), {});
  assert.equal(hub.status, 200);
  assert.equal(hub.robots, "index,follow");
  assert.equal(hub.title, compareIndexCopy("en").title);
  assert.equal(computeRouteSeo({ pathname: "/compare", locale: "fr", route: {} }).title, compareIndexCopy("fr").title);
});

test("generated pairs and the hub are server-rendered at request time when the renderer is available", async () => {
  const rendered = [];
  const render = async (url) => { rendered.push(url); return '<main class="v3-compare-page"><h1>Gate.io vs Kraken</h1></main>'; };
  const response = await html(`https://nexualpha.com/compare/${INDEXABLE_PAIR}`, { NEWS_SSR_RENDER: render });
  const body = await response.text();
  assert.equal(rendered.length, 1);
  assert.match(body, /<div id="root"><main class="v3-compare-page"><h1>Gate\.io vs Kraken<\/h1><\/main><\/div>/);
  assert.match(body, /name="robots" content="index,follow"/);
  const hub = await html("https://nexualpha.com/ja/compare", { NEWS_SSR_RENDER: async () => '<main class="v3-compare-hub"><h1>比較</h1></main>' });
  assert.match(await hub.text(), /<div id="root"><main class="v3-compare-hub">/);
  // Curated pairs keep their build-time prerender path (renderer not called).
  const curatedCalls = [];
  await html("https://nexualpha.com/compare/binance-vs-okx", { NEWS_SSR_RENDER: async (url) => { curatedCalls.push(url); return ""; } });
  assert.equal(curatedCalls.length, 0);
});

test("every user-visible template exists in all 17 locales without placeholders left behind", () => {
  for (const locale of COMPARE_LOCALES) {
    const copy = generatedCompareCopy(locale, { nameA: "A1", nameB: "B2", date: "2026-10-10" });
    for (const value of [copy.title, copy.description, copy.h1, copy.note, copy.profiles, copy.moreWith("A1"), copy.relatedCurated("A1")]) {
      assert.ok(value && !/\{\w+\}/.test(value), `${locale} ${value}`);
    }
    assert.ok(copy.note.includes("2026-10-10"), `${locale} note carries the date`);
    assert.ok(copy.h1.includes("A1") && copy.h1.includes("B2"), `${locale} h1 names both venues`);
    const picker = comparePickerCopy(locale);
    for (const key of ["title", "a", "b", "submit", "hint", "same", "placeholder"]) assert.ok(picker[key], `${locale} picker ${key}`);
    const hub = compareIndexCopy(locale);
    for (const key of ["title", "description", "h1", "intro", "curated", "generated", "generatedNote"]) assert.ok(hub[key], `${locale} hub ${key}`);
  }
});

test("SSR: generated pair renders one H1, both partner CTAs beside the disclosure, the provenance note and related links; non-partner pair has no sign-up CTA", async () => {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-compare-any-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { CompareDeepPage, CompareHubPage } from "../../src/components/v3/V3Pages.jsx";
      import { venueDatabase } from "../../src/data/venue-database.js";
      const pageCopy = { common: { dimension: "Dimension" }, assetCapabilities: { none: "Pending source review" } };
      const venues = Object.values(venueDatabase);
      const page = (selected, locale) => renderToStaticMarkup(React.createElement(CompareDeepPage, { copy: pageCopy, locale, selected, venues, updates: [], market: "unknown", product: "unknown" }));
      console.log(JSON.stringify({
        partner: page(["gate-io", "kraken"], "en"),
        partnerTr: page(["gate-io", "kraken"], "tr"),
        nonPartner: page(["dydx", "kucoin"], "en"),
        curated: page(["binance", "okx"], "en"),
        hub: renderToStaticMarkup(React.createElement(CompareHubPage, { locale: "en", venues })),
      }));
    `);
    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [entryPath, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundlePath}`, "--loader:.css=empty", "--log-level=warning"], { cwd: projectRoot, stdio: "pipe" });
    const out = Object.fromEntries(Object.entries(JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }))).map(([key, markup]) => [key, unescape(markup)]));

    for (const [key, markup] of Object.entries(out)) assert.equal(count(markup, /<h1[\s>]/g), 1, `${key}: exactly one H1`);

    const copyEn = generatedCompareCopy("en", { nameA: "Gate.io", nameB: "Kraken", date: "2026-10-10" });
    assert.ok(out.partner.includes(`<h1`) && out.partner.includes(copyEn.h1), "generated H1 uses the template");
    assert.ok(out.partner.includes(copyEn.note), "provenance note visible");
    assert.equal(count(out.partner, /data-compare-generated-note/g), 1);
    assert.match(out.partner, /data-compare-generated="true"/);
    const hero = out.partner.slice(out.partner.indexOf('id="compare-versus-card"'), out.partner.indexOf('id="compare-final-choice"') > 0 ? out.partner.length : undefined);
    assert.equal(count(hero, /data-cta-placement="compare-hero-versus"/g), 2, "two sign-up routes in the versus card");
    assert.equal(count(hero, /data-cta-kind="registration"[^>]*data-cta-placement="compare-hero-versus"|data-cta-placement="compare-hero-versus"[^>]*data-cta-kind="registration"/g), 2);
    assert.ok(hero.includes("commission-disclosure-line"), "disclosure sits in the same block as the sign-up routes");
    assert.match(out.partner, /data-compare-related="generated"/);
    assert.ok(out.partner.includes("/compare/binance-vs-kraken") && out.partner.includes("/compare/gate-io-vs-mexc"), "links curated pairs sharing a venue");
    assert.ok(out.partner.includes("/exchanges/gate-io") && out.partner.includes("/exchanges/kraken"), "links both venue profiles");

    const copyTr = generatedCompareCopy("tr", { nameA: "Gate.io", nameB: "Kraken", date: "2026-10-10" });
    assert.ok(out.partnerTr.includes(copyTr.h1) && out.partnerTr.includes(copyTr.note), "tr template rendered");

    assert.equal(count(out.nonPartner, /data-cta-kind="registration"/g), 0, "no sign-up CTA for a non-partner pair");
    assert.equal(count(out.nonPartner, /rel="sponsored/g), 0);
    assert.equal(count(out.nonPartner, /data-compare-generated-note/g), 1);

    assert.equal(count(out.curated, /data-compare-generated-note/g), 0, "curated copy untouched");
    assert.ok(!out.curated.includes('data-compare-generated="true"'));
    assert.match(out.curated, /data-compare-related="curated"/);
    assert.ok(out.curated.includes(generatedCompareCopy("en", {}).moreWith("Binance")), "More comparisons with Binance");
    const moreLinks = [...out.curated.matchAll(/data-growth-placement="curated-related-generated"/g)].length;
    assert.ok(moreLinks > 0 && moreLinks <= 6, `curated related links capped at 6 (${moreLinks})`);

    assert.ok(out.hub.includes('class="compare-any') && out.hub.includes('method="get"') && out.hub.includes('action="/compare"'), "no-JS GET form");
    assert.ok(out.hub.includes('name="a"') && out.hub.includes('name="b"'));
    assert.ok(out.hub.includes(`/compare/${INDEXABLE_PAIR}`) && !out.hub.includes(`/compare/${NOINDEX_PAIR}`), "hub lists indexable generated pairs only");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("worker ships every data module compare-generated.js pulls in", async () => {
  const prepare = await readFile(path.join(projectRoot, "scripts/prepare-sites-build.mjs"), "utf8");
  for (const name of ["compare-generated.js", "reviewed-base-fees.js", "exchange-facts.js", "referral-partners.generated.js", "exchange-research.js"]) {
    assert.ok(prepare.includes(`"${name}"`), name);
  }
});
