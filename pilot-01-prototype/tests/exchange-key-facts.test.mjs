import test from "node:test";
import assert from "node:assert/strict";
import { exchangeKeyFacts, exchangeLastVerifiedDate, EXCHANGE_KEY_FACT_SLUGS } from "../src/data/exchange-key-facts.js";
import { buildExchangeKeyFacts } from "../src/data/exchange-key-facts-source.js";
import worker from "../worker/index.js";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { feeFact } from "../src/data/exchange-facts.js";
import { licenseRecords } from "../src/data/licenses.js";
const execFileAsync = promisify(execFile);

test("sheets reuse checked fees and regulator records and omit unknown fields", () => {
  for (const slug of EXCHANGE_KEY_FACT_SLUGS) {
    const sheet = exchangeKeyFacts(slug);
    assert.deepEqual(sheet, buildExchangeKeyFacts(slug), "snapshot matches existing source data");
    assert.ok(sheet.rows.length, `${slug} needs at least one sourced row`);
    assert.equal(new Set(sheet.rows.map(row => row.id)).size, sheet.rows.length, `${slug} row ids must be unique for React hydration`);
    for (const row of sheet.rows) {
      assert.ok(row.sourceUrls.length);
      assert.match(row.checkedOn, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(!row.sourceUrls.some(url => /[?&](?:ref|invite|code)=/i.test(url)));
      if (row.id.endsWith("-fees")) {
        const expected = feeFact(slug, row.id.split("-")[0]);
        assert.equal(expected.state, "checked");
        assert.equal(row.value.maker, expected.maker);
        assert.equal(row.value.taker, expected.taker);
        assert.equal(row.checkedOn, expected.checkedOn);
      }
      if (row.id.startsWith("license-")) assert.ok(licenseRecords.some(record => record.exchange === slug && record.entityName === row.value.entity && record.sourceUrl === row.sourceUrls[0]));
      assert.ok(!["founded-year", "headquarters"].includes(row.id));
    }
  }
  assert.ok(!exchangeKeyFacts("mexc").rows.some(row => row.id.endsWith("-fees")));
  const okxAustracLicenseIds = exchangeKeyFacts("okx").rows
    .filter(row => row.id.startsWith("license-au-austrac"))
    .map(row => row.id)
    .sort();
  assert.deepEqual(okxAustracLicenseIds, ["license-au-austrac-acn-145724509", "license-au-austrac-acn-636269040"]);
  assert.ok(exchangeKeyFacts("backpack").rows.some(row => row.id === "product-scope"));
  assert.equal(exchangeKeyFacts("unknown"), null);
});

test("neutral contexts contain no codes; Türkiye excludes Bitget", () => {
  for (const locale of ["ru", "ar", "zh-Hant", "ur", "uk", "vi"]) {
    const sheet = exchangeKeyFacts("okx", { locale });
    assert.doesNotMatch(JSON.stringify(sheet), /\/go\/|inviteCode|registrationUrl|rebate/i);
  }
  assert.equal(exchangeKeyFacts("bitget", { locale: "tr" }), null);
  assert.equal(exchangeKeyFacts("bitget", { locale: "tr", market: "US" }), null);
  assert.equal(exchangeKeyFacts("bitget", { market: "TR" }), null);
});

test("page-level last verified date is derived from the newest dated source row", () => {
  assert.equal(exchangeLastVerifiedDate("okx"), "2026-10-14"); // newest licence register check
  assert.equal(exchangeLastVerifiedDate("binance"), "2026-10-14"); // newest licence register check
  assert.equal(exchangeLastVerifiedDate("hyperliquid"), "2026-10-10");
  assert.equal(exchangeLastVerifiedDate("backpack"), null);
  assert.equal(exchangeLastVerifiedDate("unknown"), null);
  const relevant = (row) => row.id.endsWith("-fees") || row.id.startsWith("license-") || (/(?:invite|referral|code)/i.test(row.id) && (row.value?.verified === true || ["verified", "source-backed", "confirmed"].includes(String(row.value?.status || "").toLowerCase())));
  for (const slug of EXCHANGE_KEY_FACT_SLUGS) {
    const dates = exchangeKeyFacts(slug).rows.filter(relevant).map((row) => {
      assert.match(row.checkedOn, /^\d{4}-\d{2}-\d{2}$/);
      const time = Date.parse(`${row.checkedOn}T00:00:00Z`);
      assert.ok(Number.isFinite(time), `${slug}/${row.id} date parses`);
      return { day: row.checkedOn, time };
    }).sort((a, b) => a.time - b.time);
    const lastVerified = exchangeLastVerifiedDate(slug);
    assert.equal(lastVerified, dates.at(-1)?.day || null, slug);
    if (lastVerified) assert.ok(Date.parse(`${lastVerified}T00:00:00Z`) <= Date.now() + 8 * 3600 * 1000, `${slug} must not publish future freshness`);
  }
});

test("worker serves cacheable CORS-safe JSON, rejects unknown slugs and mutations", async () => {
  const get = (path, method = "GET") => worker.fetch(new Request(`https://nexualpha.com/api/exchange-facts/${path}`, { method }), {});
  const response = await get("okx.json");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), exchangeKeyFacts("okx"));
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.equal(response.headers.get("cache-control"), "public, max-age=3600");
  assert.match(response.headers.get("content-type"), /application\/json/);
  for (const path of ["missing.json", "bitget.json?locale=tr", "bitget.json?market=TR", "okx.html"]) assert.equal((await get(path)).status, 404);
  assert.equal((await get("okx.json", "POST")).status, 405);
  const head = await get("okx.json", "HEAD");
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
});

test("robots keeps AI crawlers open while preserving /go and /insights blocks", async () => {
  const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
  for (const agent of ["GPTBot", "PerplexityBot", "ClaudeBot", "Google-Extended"]) {
    const group = robots.match(new RegExp(`User-agent: ${agent}[\\s\\S]*?(?=\\nUser-agent:|\\nSitemap:|$)`))?.[0] || "";
    assert.match(group, /Allow: \//);
    assert.match(group, /Disallow: \/go\//);
    assert.match(group, /Disallow: \/insights\//);
  }
});

test("llms generator exposes GEO discovery routes and exchange facts JSON endpoints", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "nexualpha-geo-facts-"));
  try {
    await execFileAsync(process.execPath, ["scripts/generate-public-llms.mjs"], {
      cwd: new URL("..", import.meta.url),
      env: { ...process.env, NEXUALPHA_LLMS_OUTPUT_DIR: outputDir },
      maxBuffer: 1024 * 1024 * 10,
    });
    const llms = await readFile(join(outputDir, "llms.txt"), "utf8");
    const full = await readFile(join(outputDir, "llms-full.txt"), "utf8");
    for (const text of [llms, full]) {
      assert.doesNotMatch(text, /https:\/\/nexualpha\.com\/factbook\//);
      assert.match(text, /License directory: https:\/\/nexualpha\.com\/licenses/);
      assert.match(text, /Fee benchmark: https:\/\/nexualpha\.com\/rates/);
      assert.match(text, /OKX: invite code nexu888/);
      assert.doesNotMatch(text, /(?:invite|referral) codes (?:are )?(?:omitted|excluded)/i);
      for (const route of ["/exchanges", "/rates", "/licenses", "/funding-rates", "/liquidations", "/long-short", "/whales", "/calendar", "/academy", "/glossary"]) {
        assert.ok(text.includes(`https://nexualpha.com${route}`), `missing ${route}`);
      }
      for (const slug of ["okx", "binance", "bybit", "bitget", "kraken", "backpack"]) {
        assert.ok(text.includes(`https://nexualpha.com/api/exchange-facts/${slug}.json`), `missing JSON endpoint for ${slug}`);
      }
    }
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("SSR table includes citations and dated values, respects locale attribution and Türkiye", async () => {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const { execFileSync } = await import("node:child_process");
  const directory = await mkdtemp(new URL("./.tmp-key-facts-", import.meta.url));
  try {
    await writeFile(`${directory}/entry.jsx`, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { ExchangeKeyFacts } from "../../src/components/v3/ExchangeKeyFacts.jsx";
      const pages = Object.fromEntries(["en", "tr", "ru", "ar", "zh-Hant", "ur", "uk", "vi"].map(locale => [locale, renderToStaticMarkup(React.createElement(ExchangeKeyFacts, { slug: "binance", locale }))]));
      pages.bitgetTr = renderToStaticMarkup(React.createElement(ExchangeKeyFacts, { slug: "bitget", locale: "tr" }));
      console.log(JSON.stringify(pages));
    `);
    execFileSync("./node_modules/.bin/esbuild", [`${directory}/entry.jsx`, "--bundle", "--platform=node", "--format=cjs", "--loader:.css=empty", `--outfile=${directory}/bundle.cjs`]);
    const pages = JSON.parse(execFileSync(process.execPath, [`${directory}/bundle.cjs`], { encoding: "utf8" }));
    assert.match(pages.en, /<table>/);
    assert.match(pages.en, /2026-10-10/);
    assert.match(pages.en, /binance.com\/en\/fee\/trading/);
    assert.match(pages.en, /\/go\/binance-page\?to=/);
    for (const locale of ["ru", "ar", "zh-Hant", "ur", "uk", "vi"]) assert.doesNotMatch(pages[locale], /href=|\/go\//);
    assert.equal(pages.bitgetTr, "");
  } finally { await rm(directory, { recursive: true, force: true }); }
});


test('key-fact interface labels cover all site locales without leaking English fallbacks', async () => {
  const { exchangeKeyFactLabels } = await import('../src/data/exchange-key-facts-copy.js');
  const { LOCALE_PREFIX_BY_CODE } = await import('../src/data/locale-routing.js');
  const en = exchangeKeyFactLabels('en');
  for (const locale of Object.keys(LOCALE_PREFIX_BY_CODE)) {
    const labels = exchangeKeyFactLabels(locale);
    assert.deepEqual(Object.keys(labels), Object.keys(en), locale);
    for (const key of Object.keys(en)) {
      assert.ok(labels[key], `${locale}/${key}`);
      if (locale !== 'en') assert.notEqual(labels[key], en[key], `${locale}/${key}`);
    }
  }
});
